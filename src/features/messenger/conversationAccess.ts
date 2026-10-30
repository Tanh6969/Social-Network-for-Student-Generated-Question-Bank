import type { Conversation } from '../demo/types';

export function getConversationsForAccount(
  conversations: Conversation[],
  accountId: string,
): Conversation[] {
  return conversations.filter((conversation) =>
    conversation.participantIds.includes(accountId),
  );
}

export function getConversationPartnerId(
  conversation: Conversation,
  accountId: string,
): string | undefined {
  return conversation.participantIds.find(
    (participantId) => participantId !== accountId,
  );
}
