import type { Conversation } from '../demo/types';

export type SharedChatMessage =
  | { type: 'REQUEST_SNAPSHOT' }
  | { type: 'UPDATE_SNAPSHOT'; conversations: Conversation[] };

export function isSharedChatMessage(
  value: unknown,
): value is SharedChatMessage {
  if (typeof value !== 'object' || value === null || !('type' in value))
    return false;
  const message = value as { type?: unknown; conversations?: unknown };
  if (message.type === 'REQUEST_SNAPSHOT') return true;
  return (
    message.type === 'UPDATE_SNAPSHOT' &&
    isConversationSnapshot(message.conversations)
  );
}

export function isConversationSnapshot(
  value: unknown,
): value is Conversation[] {
  return (
    Array.isArray(value) &&
    value.every(
      (conversation) =>
        typeof conversation === 'object' &&
        conversation !== null &&
        'id' in conversation &&
        typeof conversation.id === 'string' &&
        'participantIds' in conversation &&
        Array.isArray(conversation.participantIds) &&
        conversation.participantIds.every(
          (participantId) => typeof participantId === 'string',
        ) &&
        'messages' in conversation &&
        Array.isArray(conversation.messages),
    )
  );
}

export function areConversationSnapshotsEqual(
  first: Conversation[],
  second: Conversation[],
): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}
