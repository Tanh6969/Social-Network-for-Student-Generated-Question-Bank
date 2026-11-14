import { tokenStore } from '../../api/token';

/** STOMP 1.2 over the same-origin WebSocket endpoint documented by Swagger. */
export class ChatSocket {
  private socket: WebSocket | null = null;
  private connecting: Promise<void> | null = null;
  private connected = false;
  private disposed = false;
  private retry: number | null = null;
  private buffer = '';

  constructor(
    private readonly onEvent: (body: string) => void,
    private readonly onConnected?: () => void,
  ) {}

  private frame(command: string, headers: Record<string, string>, body = '') {
    const lines = [command, ...Object.entries(headers).map(([key, value]) => `${key}:${value}`)];
    this.socket?.send(`${lines.join('\n')}\n\n${body}\0`);
  }

  connect(): Promise<void> {
    if (this.connected) return Promise.resolve();
    if (this.connecting) return this.connecting;
    const token = tokenStore.get();
    if (!token) return Promise.reject(new Error('Phiên đăng nhập chưa sẵn sàng.'));
    this.disposed = false;
    this.connecting = new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        this.connecting = null;
        if (error) reject(error); else resolve();
      };
      const url = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/v1/ws`;
      const ws = new WebSocket(url, ['v12.stomp', 'v11.stomp']);
      this.socket = ws;
      const timeout = window.setTimeout(() => {
        finish(new Error('Kết nối chat quá thời gian chờ.'));
        ws.close();
      }, 10_000);
      ws.onopen = () => this.frame('CONNECT', {
        'accept-version': '1.2,1.1',
        'heart-beat': '0,0',
        Authorization: `Bearer ${token}`,
      });
      ws.onmessage = (event) => {
        this.buffer += String(event.data);
        const frames = this.buffer.split('\0');
        this.buffer = frames.pop() ?? '';
        for (const raw of frames) {
          const frame = raw.trimStart();
          const separator = frame.indexOf('\n\n');
          const header = separator < 0 ? frame : frame.slice(0, separator);
          const body = separator < 0 ? '' : frame.slice(separator + 2);
          const command = header.split('\n')[0];
          if (command === 'CONNECTED') {
            this.connected = true;
            this.frame('SUBSCRIBE', { id: 'chat-events', destination: '/user/queue/messages', ack: 'auto' });
            this.onConnected?.();
            finish();
          } else if (command === 'MESSAGE') this.onEvent(body);
          else if (command === 'ERROR') finish(new Error(body || 'Máy chủ chat từ chối kết nối.'));
        }
      };
      ws.onerror = () => finish(new Error('Không kết nối được máy chủ chat.'));
      ws.onclose = () => {
        const current = this.socket === ws;
        if (current) {
          this.connected = false;
          this.socket = null;
        }
        finish(new Error('Mất kết nối chat.'));
        if (current && !this.disposed && tokenStore.get())
          this.retry = window.setTimeout(() => { void this.connect().catch(() => undefined); }, 3_000);
      };
    });
    return this.connecting;
  }

  async send(conversationId: number, content: string): Promise<void> {
    await this.connect();
    this.frame('SEND', { destination: '/app/chat.send', 'content-type': 'application/json' },
      JSON.stringify({ conversation_id: conversationId, content, message_type: 'TEXT', media_urls: [] }));
  }

  async read(conversationId: number, messageId: number): Promise<void> {
    await this.connect();
    this.frame('SEND', { destination: '/app/chat.read', 'content-type': 'application/json' },
      JSON.stringify({ conversation_id: conversationId, message_id: messageId }));
  }

  reconnect() {
    const old = this.socket;
    this.socket = null;
    this.connected = false;
    this.connecting = null;
    old?.close();
    if (tokenStore.get()) void this.connect().catch(() => undefined);
  }

  close() {
    this.disposed = true;
    if (this.retry !== null) window.clearTimeout(this.retry);
    const old = this.socket;
    this.socket = null;
    old?.close();
    this.connected = false;
  }
}
