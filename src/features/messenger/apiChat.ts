import type { ConversationDto, ConversationMemberDto, MessageDto } from '../../api/chat';
import { basicUser } from '../friends/apiRelationships';
import type { Conversation, MessageItem, User } from '../demo/types';

export function conversationFromApi(
  dto: ConversationDto,
  members: ConversationMemberDto[],
  currentUser: User,
  previous?: Conversation,
): Conversation {
  const partnerMember = members.find((member) => String(member.user_id) !== currentUser.id);
  const partner = dto.type === 'GROUP'
    ? { ...basicUser({ user_id: 0, full_name: dto.display_name, avatar_url: dto.display_avatar_url }),
        id: `group:${dto.conversation_id}`, name: dto.display_name || 'Nhóm chat' }
    : partnerMember?.user_id != null
      ? basicUser(partnerMember)
      : { ...basicUser({ user_id: 0, full_name: dto.display_name, avatar_url: dto.display_avatar_url }),
          id: `conversation:${dto.conversation_id}` };
  return {
    id: String(dto.conversation_id),
    participantIds: members.map((member) => String(member.user_id)),
    partner,
    isGroup: dto.type === 'GROUP',
    lastMessage: dto.last_message?.revoked ? 'Tin nhắn đã được thu hồi' : dto.last_message?.content ?? '',
    lastMessageId: dto.last_message?.message_id,
    lastMessageTime: dto.last_message?.created_at ?? dto.updated_at ?? '',
    unreadCount: dto.unread_count ?? 0,
    messages: previous?.messages ?? [],
  };
}

export function messageFromApi(dto: MessageDto, conversationId: string): MessageItem {
  return {
    id: String(dto.message_id),
    conversationId,
    senderId: String(dto.sender_id),
    text: dto.revoked ? 'Tin nhắn đã được thu hồi' : dto.content ?? '',
    timestamp: dto.created_at ? new Date(dto.created_at).toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit',
    }) : '',
    status: 'SENT',
    isRecalled: Boolean(dto.revoked),
    attachmentUrl: dto.media_urls?.[0],
  };
}
