/**
 * STOMP destinations are documented in OpenAPI info.description rather than
 * machine-readable paths or schemas. Keep these types separate from generated REST code.
 */
export const realtimeDestinations = {
  handshake: '/api/v1/ws',
  send: '/app/chat.send',
  read: '/app/chat.read',
  typing: '/app/chat.typing',
  personalMessages: '/user/queue/messages',
  conversationTyping: (conversationId: number) =>
    `/topic/conv.${conversationId}.typing`,
} as const;

export interface SendWsMessageRequestDto {
  conversation_id: number;
  content: string;
  message_type: 'TEXT' | 'IMAGE' | 'FILE';
  media_urls?: string[];
  reply_to_message_id?: number;
}

export interface ReadWsMessageRequestDto {
  conversation_id: number;
  message_id: number;
}

export interface TypingWsRequestDto {
  conversation_id: number;
  is_typing: boolean;
}

// Swagger names these broadcast DTOs but does not define their fields as schemas.
export type WsMessageBroadcastDto = unknown;
export type WsReadReceiptBroadcastDto = unknown;
export type WsTypingBroadcastDto = unknown;
