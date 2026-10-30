import { describe, expect, it } from 'vitest';
import {
  getConversationPartnerId,
  getConversationsForAccount,
} from '../src/features/messenger/conversationAccess';
import { mockConversations } from '../src/mocks/mockData';

describe('account-specific conversations', () => {
  it('only includes conversations where the signed-in user is a participant', () => {
    expect(
      getConversationsForAccount(mockConversations, 'user_sv_02').map(
        (conversation) => conversation.id,
      ),
    ).toEqual(['conv_01']);
    expect(
      getConversationsForAccount(mockConversations, 'user_gv_01').map(
        (conversation) => conversation.id,
      ),
    ).toEqual(['conv_02']);
    expect(getConversationsForAccount(mockConversations, 'user_sv_99')).toEqual(
      [],
    );
  });

  it('resolves the other participant for either account in a direct chat', () => {
    const conversation = mockConversations[0];
    expect(getConversationPartnerId(conversation, 'user_sv_01')).toBe(
      'user_sv_02',
    );
    expect(getConversationPartnerId(conversation, 'user_sv_02')).toBe(
      'user_sv_01',
    );
  });
});
