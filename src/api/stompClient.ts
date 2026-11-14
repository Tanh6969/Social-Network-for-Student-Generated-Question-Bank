import {
  realtimeDestinations,
  type ReadWsMessageRequestDto,
  type SendWsMessageRequestDto,
  type TypingWsRequestDto,
} from './realtime-contract';
import { tokenStore } from './token';

export interface WsMessageBroadcastDto {
  message_id?: number;
  conversation_id?: number;
  sender_id?: number;
  sender_name?: string;
  avatar_url?: string;
  frame_url?: string;
  content?: string;
  message_type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'GIF' | 'FILE';
  media_urls?: string[];
  created_at?: string;
  revoked?: boolean;
  edited?: boolean;
  /** Khi nhận biên nhận đã đọc trên cùng queue `/user/queue/messages` */
  reader_id?: number;
  last_read_message_id?: number;
  read_at?: string;
}

export interface WsTypingBroadcastDto {
  conversation_id?: number;
  user_id?: number;
  full_name?: string;
  user_name?: string;
  is_typing?: boolean;
}

export interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

function buildStompFrame(
  command: string,
  headers: Record<string, string> = {},
  body = '',
): string {
  const headerLines = Object.entries(headers).map(([k, v]) => `${k}:${v}`);
  return `${[command, ...headerLines].join('\n')}\n\n${body}\x00`;
}

function parseStompFrames(raw: string): StompFrame[] {
  const frames: StompFrame[] = [];
  const parts = raw.split('\x00');
  for (const part of parts) {
    const trimmed = part.replace(/^\n+/, '');
    if (!trimmed) continue;
    const dividerIndex = trimmed.indexOf('\n\n');
    const headerBlock =
      dividerIndex >= 0 ? trimmed.slice(0, dividerIndex) : trimmed;
    const body = dividerIndex >= 0 ? trimmed.slice(dividerIndex + 2) : '';
    const lines = headerBlock.split(/\r?\n/);
    const command = lines[0]?.trim() ?? '';
    if (!command) continue;
    const headers: Record<string, string> = {};
    for (let i = 1; i < lines.length; i += 1) {
      const sep = lines[i].indexOf(':');
      if (sep > 0) {
        const key = lines[i].slice(0, sep).trim();
        const value = lines[i].slice(sep + 1).trim();
        if (!(key in headers)) headers[key] = value;
      }
    }
    frames.push({ command, headers, body });
  }
  return frames;
}

export function resolveStompWsUrls(): string[] {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ?? 'https://snsqb.duckdns.org/api/v1';
  let wsBase: string;
  if (apiBase.startsWith('https://')) {
    wsBase = apiBase.replace(/^https:\/\//, 'wss://').replace(/\/+$/, '');
  } else if (apiBase.startsWith('http://')) {
    wsBase = apiBase.replace(/^http:\/\//, 'ws://').replace(/\/+$/, '');
  } else if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const path = apiBase.startsWith('/') ? apiBase : `/${apiBase}`;
    wsBase = `${proto}//${window.location.host}${path.replace(/\/+$/, '')}`;
  } else {
    wsBase = 'wss://snsqb.duckdns.org/api/v1';
  }
  const primary = wsBase.endsWith('/api/v1')
    ? `${wsBase}/ws`
    : `${wsBase}${realtimeDestinations.handshake}`;
  const serverId = String(Math.floor(100 + Math.random() * 900));
  const sessionId = Math.random().toString(36).slice(2, 10);
  // Ưu tiên `/api/v1/ws/websocket` (SockJS raw WebSocket transport) và
  // `/api/v1/ws/{serverId}/{sessionId}/websocket` (SockJS framed transport)
  // vì backend Spring Boot bật `.withSockJS()` trên `/api/v1/ws`.
  return [
    `${primary}/websocket`,
    `${primary}/${serverId}/${sessionId}/websocket`,
    primary,
  ];
}

type MessageListener = (payload: WsMessageBroadcastDto) => void;
type TypingListener = (payload: WsTypingBroadcastDto) => void;

export class ChatStompManager {
  private ws: WebSocket | null = null;
  private connected = false;
  private isSockJsFramed = false;
  private manualClose = false;
  private urlIndex = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private messageListeners = new Set<MessageListener>();
  private typingListeners = new Map<string, Set<TypingListener>>();
  private activeTypingSubs = new Set<string>();
  private pendingFrames: string[] = [];

  connect(): void {
    if (typeof WebSocket === 'undefined') return;
    const token = tokenStore.get();
    if (!token) return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.manualClose = false;
    const urls = resolveStompWsUrls();
    const targetUrl = urls[this.urlIndex % urls.length];
    const expectsSockJsFrame = /\/\d+\/[^/]+\/websocket$/.test(targetUrl);
    this.isSockJsFramed = expectsSockJsFrame;

    try {
      const socket = new WebSocket(targetUrl);
      this.ws = socket;

      const sendConnectFrame = () => {
        const currentToken = tokenStore.get() ?? token;
        const connectFrame = buildStompFrame('CONNECT', {
          'accept-version': '1.2,1.1,1.0',
          'heart-beat': '10000,10000',
          Authorization: `Bearer ${currentToken}`,
        });
        this.sendRawFrame(connectFrame);
      };

      if (this.connectTimeoutTimer) clearTimeout(this.connectTimeoutTimer);
      this.connectTimeoutTimer = setTimeout(() => {
        if (!this.connected && this.ws === socket) {
          try {
            socket.close();
          } catch {
            // ignore
          }
        }
      }, 4500);

      socket.onopen = () => {
        // Với raw WebSocket (`/ws/websocket` hoặc `/ws`), gửi CONNECT ngay khi mở.
        // Với SockJS framed (`/{server}/{session}/websocket`), đợi frame mở `'o'`.
        if (!this.isSockJsFramed) {
          sendConnectFrame();
        }
      };

      socket.onmessage = (event: MessageEvent) => {
        if (typeof event.data !== 'string') return;
        const raw = event.data;

        // SockJS open frame
        if (raw === 'o') {
          this.isSockJsFramed = true;
          sendConnectFrame();
          return;
        }
        // SockJS heartbeat frame
        if (raw === 'h') {
          return;
        }
        // SockJS close frame `c[code,"reason"]`
        if (raw.startsWith('c[')) {
          try {
            socket.close();
          } catch {
            // ignore
          }
          return;
        }
        // SockJS array frame `a["..."]`
        if (raw.startsWith('a[')) {
          this.isSockJsFramed = true;
          try {
            const payloads = JSON.parse(raw.slice(1)) as string[];
            for (const item of payloads) {
              for (const frame of parseStompFrames(item)) {
                this.handleFrame(frame);
              }
            }
          } catch {
            // ignore malformed SockJS frame
          }
          return;
        }

        const frames = parseStompFrames(raw);
        for (const frame of frames) {
          this.handleFrame(frame);
        }
      };

      socket.onerror = () => {
        // Không tăng urlIndex ở đây vì `onclose` luôn được gọi ngay sau `onerror`.
      };

      socket.onclose = () => {
        const wasConnected = this.connected;
        this.cleanupSocket();
        if (!this.manualClose && tokenStore.get()) {
          if (!wasConnected) {
            this.urlIndex = (this.urlIndex + 1) % urls.length;
          }
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, 1500);
        }
      };
    } catch {
      // Bỏ qua lỗi tạo WebSocket trong môi trường không hỗ trợ.
    }
  }

  disconnect(): void {
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.connected) {
      try {
        this.ws.send(buildStompFrame('DISCONNECT'));
      } catch {
        // ignore
      }
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
    }
    this.cleanupSocket();
  }

  isConnected(): boolean {
    return this.connected;
  }

  onUserMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  subscribeTyping(
    conversationId: number | string,
    listener: TypingListener,
  ): () => void {
    const key = String(conversationId);
    let set = this.typingListeners.get(key);
    if (!set) {
      set = new Set();
      this.typingListeners.set(key, set);
    }
    set.add(listener);

    if (!this.activeTypingSubs.has(key) && this.connected) {
      this.activeTypingSubs.add(key);
      this.sendRawFrame(
        buildStompFrame('SUBSCRIBE', {
          id: `sub-typing-${key}`,
          destination: realtimeDestinations.conversationTyping(Number(key)),
        }),
      );
    }

    return () => {
      const currentSet = this.typingListeners.get(key);
      currentSet?.delete(listener);
      if (currentSet && currentSet.size === 0) {
        this.typingListeners.delete(key);
        if (this.activeTypingSubs.has(key)) {
          this.activeTypingSubs.delete(key);
          if (this.connected) {
            this.sendRawFrame(
              buildStompFrame('UNSUBSCRIBE', {
                id: `sub-typing-${key}`,
              }),
            );
          }
        }
      }
    };
  }

  /** Publish tới `/app/chat.send` */
  sendMessage(payload: SendWsMessageRequestDto): boolean {
    return this.publish(realtimeDestinations.send, payload);
  }

  /** Publish tới `/app/chat.read` */
  sendReadReceipt(payload: ReadWsMessageRequestDto): boolean {
    return this.publish(realtimeDestinations.read, payload);
  }

  /** Publish tới `/app/chat.typing` */
  sendTyping(payload: TypingWsRequestDto): boolean {
    return this.publish(realtimeDestinations.typing, payload);
  }

  private publish(destination: string, payload: unknown): boolean {
    const frame = buildStompFrame(
      'SEND',
      {
        destination,
        'content-type': 'application/json',
      },
      JSON.stringify(payload),
    );
    if (!this.connected) {
      this.pendingFrames.push(frame);
      this.connect();
      return false;
    }
    return this.sendRawFrame(frame);
  }

  private sendRawFrame(frame: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    try {
      const wireData = this.isSockJsFramed ? JSON.stringify([frame]) : frame;
      this.ws.send(wireData);
      return true;
    } catch {
      return false;
    }
  }

  private handleFrame(frame: StompFrame): void {
    if (frame.command === 'CONNECTED') {
      this.connected = true;
      if (this.connectTimeoutTimer) {
        clearTimeout(this.connectTimeoutTimer);
        this.connectTimeoutTimer = null;
      }
      // Đăng ký lắng nghe `/user/queue/messages`
      this.sendRawFrame(
        buildStompFrame('SUBSCRIBE', {
          id: 'sub-user-messages',
          destination: realtimeDestinations.personalMessages,
        }),
      );
      // Đăng ký lại các kênh typing đang mở
      for (const convId of this.typingListeners.keys()) {
        this.activeTypingSubs.add(convId);
        this.sendRawFrame(
          buildStompFrame('SUBSCRIBE', {
            id: `sub-typing-${convId}`,
            destination: realtimeDestinations.conversationTyping(
              Number(convId),
            ),
          }),
        );
      }
      // Gửi các frame đang xếp hàng chờ kết nối
      while (this.pendingFrames.length > 0) {
        const nextFrame = this.pendingFrames.shift();
        if (nextFrame) this.sendRawFrame(nextFrame);
      }
      // Heartbeat 10s
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => {
        this.sendRawFrame('\n');
      }, 10_000);
      return;
    }

    if (frame.command === 'MESSAGE') {
      const dest = frame.headers.destination ?? '';
      const subId = frame.headers.subscription ?? '';
      if (!frame.body) return;
      try {
        const parsed = JSON.parse(frame.body);
        if (
          subId === 'sub-user-messages' ||
          dest === realtimeDestinations.personalMessages ||
          dest.includes('/queue/messages')
        ) {
          for (const listener of this.messageListeners) {
            listener(parsed as WsMessageBroadcastDto);
          }
          return;
        }
        const typingMatch =
          /^\/topic\/conv\.([^.]+)\.typing$/.exec(dest) ??
          /^sub-typing-(.+)$/.exec(subId);
        if (typingMatch) {
          const convId = typingMatch[1];
          const listeners = this.typingListeners.get(convId);
          if (listeners) {
            for (const listener of listeners) {
              listener(parsed as WsTypingBroadcastDto);
            }
          }
        }
      } catch {
        // Bỏ qua payload không phải JSON hợp lệ
      }
    }
  }

  private cleanupSocket(): void {
    this.connected = false;
    this.activeTypingSubs.clear();
    if (this.connectTimeoutTimer) {
      clearTimeout(this.connectTimeoutTimer);
      this.connectTimeoutTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.ws = null;
  }
}

export const chatStompClient = new ChatStompManager();
export { buildStompFrame, parseStompFrames };
