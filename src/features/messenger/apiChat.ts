import type {
  ConversationDetailDto,
  ConversationDto,
  ConversationMemberDto,
  MessageDto,
} from '../../api/chat';
import type { WsMessageBroadcastDto } from '../../api/stompClient';
import type {
  Conversation,
  ConversationMemberInfo,
  MessageItem,
  User,
} from '../demo/types';
import { basicUser } from '../friends/apiRelationships';

const DEFAULT_AVATAR = '/default-avatar.svg';

export function formatChatTime(iso?: string): string {
  if (!iso) return 'Vừa xong';
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return iso;
  return new Date(time).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function memberFromDto(
  dto: ConversationMemberDto,
): ConversationMemberInfo {
  return {
    userId: String(dto.user_id ?? ''),
    name: dto.full_name || `Thành viên #${dto.user_id ?? '?'}`,
    avatar: dto.avatar_url || DEFAULT_AVATAR,
    role: dto.role ?? 'VILLAGER',
  };
}

export function messageFromDto(
  dto: MessageDto & {
    id?: number;
    text?: string;
    sender?: { user_id?: number };
  },
  conversationId: string,
): MessageItem {
  const isRevoked = Boolean(dto.revoked);
  const msgId = dto.message_id ?? dto.id ?? Date.now();
  const senderId = dto.sender_id ?? dto.sender?.user_id ?? '';
  return {
    id: String(msgId),
    conversationId,
    senderId: String(senderId),
    text: isRevoked
      ? 'Tin nhắn đã được thu hồi'
      : (dto.content ??
        dto.text ??
        (dto.media_urls?.[0] ? '[Đính kèm phương tiện]' : '')),
    timestamp: formatChatTime(dto.created_at),
    status: 'DELIVERED',
    isRecalled: isRevoked,
    attachmentUrl: dto.media_urls?.[0],
  };
}

export function messageFromWs(
  dto: WsMessageBroadcastDto & {
    id?: number;
    text?: string;
    sender?: { user_id?: number };
  },
  fallbackConvId?: string,
): MessageItem {
  const convId = String(dto.conversation_id ?? fallbackConvId ?? '');
  const isRevoked = Boolean(dto.revoked);
  const msgId = dto.message_id ?? dto.id ?? Date.now();
  const senderId = dto.sender_id ?? dto.sender?.user_id ?? '';
  return {
    id: String(msgId),
    conversationId: convId,
    senderId: String(senderId),
    text: isRevoked
      ? 'Tin nhắn đã được thu hồi'
      : (dto.content ?? dto.text ?? ''),
    timestamp: formatChatTime(dto.created_at),
    status: 'DELIVERED',
    isRecalled: isRevoked,
    attachmentUrl: dto.media_urls?.[0],
  };
}

export function conversationFromDto(
  dto: ConversationDto,
  currentUserId: string,
  knownUsers: Record<string, User> = {},
  existing?: Conversation,
): Conversation {
  const id = String(dto.conversation_id ?? existing?.id ?? '');
  const isGroup = dto.type === 'GROUP';
  // Tìm người dùng khớp tên trong danh sách đã biết nếu là chat 1-1
  const matchedKnown = !isGroup
    ? Object.values(knownUsers).find(
        (u) =>
          u.id !== currentUserId &&
          dto.display_name &&
          u.name.toLowerCase() === dto.display_name.toLowerCase(),
      )
    : undefined;

  const partner: User = existing?.partner?.id &&
    !existing.partner.id.startsWith('conv_partner_')
    ? {
        ...existing.partner,
        name: dto.display_name || existing.partner.name,
        avatar: dto.display_avatar_url || existing.partner.avatar,
      }
    : matchedKnown ?? {
        ...basicUser({
          user_id: dto.conversation_id,
          full_name:
            dto.display_name ||
            (isGroup ? `Nhóm #${id}` : `Hội thoại #${id}`),
          avatar_url: dto.display_avatar_url,
        }),
        id: isGroup ? `group_${id}` : `conv_partner_${id}`,
        classOrTitle: isGroup
          ? `Nhóm · ${dto.member_count ?? 2} thành viên`
          : 'Trò chuyện trực tiếp',
      };

  const participantIds = existing?.participantIds?.includes(currentUserId)
    ? existing.participantIds
    : [currentUserId, partner.id];

  const lastMsgText = dto.last_message?.content
    ? dto.last_message.content
    : dto.last_message?.message_type && dto.last_message.message_type !== 'TEXT'
      ? `[${dto.last_message.message_type}]`
      : (existing?.lastMessage ?? 'Bắt đầu cuộc trò chuyện');

  const unread = dto.unread_count ?? existing?.unreadCount ?? 0;
  const lastMsgTime = formatChatTime(
    dto.last_message?.created_at ?? dto.updated_at,
  );

  const fallbackMessages: MessageItem[] =
    existing?.messages && existing.messages.length > 0
      ? existing.messages
      : dto.last_message?.content
        ? [
            {
              id: String(dto.last_message.message_id ?? `last_${id}`),
              conversationId: id,
              senderId: unread > 0 ? partner.id : currentUserId,
              text: dto.last_message.content,
              timestamp: lastMsgTime,
              status: 'DELIVERED',
            },
          ]
        : [];

  return {
    id,
    type: dto.type ?? existing?.type ?? 'DIRECT',
    participantIds,
    partner,
    lastMessage: lastMsgText,
    lastMessageTime: lastMsgTime,
    unreadCount: unread,
    unreadCounts: { [currentUserId]: unread },
    isHidden: Boolean(dto.hidden_at),
    muted: Boolean(dto.muted),
    memberCount: dto.member_count ?? existing?.memberCount,
    members: existing?.members,
    messages: fallbackMessages,
  };
}

export function conversationFromDetailDto(
  dto: ConversationDetailDto,
  currentUserId: string,
  knownUsers: Record<string, User> = {},
  existing?: Conversation,
): Conversation {
  const id = String(dto.conversation_id ?? existing?.id ?? '');
  const isGroup = dto.type === 'GROUP';
  const members = (dto.members ?? []).map(memberFromDto);
  const otherMember = members.find((m) => m.userId !== currentUserId);

  let partner: User;
  if (isGroup) {
    partner = {
      ...basicUser({
        user_id: dto.conversation_id,
        full_name: dto.name || existing?.partner.name || `Nhóm #${id}`,
        avatar_url: dto.avatar_url || existing?.partner.avatar,
      }),
      id: `group_${id}`,
      classOrTitle: `Nhóm · ${members.length || existing?.memberCount || 3} thành viên`,
    };
  } else if (otherMember) {
    const known = knownUsers[otherMember.userId];
    partner = known
      ? {
          ...known,
          name: otherMember.name || known.name,
          avatar: otherMember.avatar || known.avatar,
        }
      : {
          ...basicUser({
            user_id: Number(otherMember.userId),
            full_name: otherMember.name,
            avatar_url: otherMember.avatar,
          }),
          id: otherMember.userId,
        };
  } else if (existing?.partner) {
    partner = existing.partner;
  } else {
    partner = {
      ...basicUser({
        user_id: dto.conversation_id,
        full_name: dto.name || `Hội thoại #${id}`,
        avatar_url: dto.avatar_url,
      }),
      id: `conv_partner_${id}`,
    };
  }

  const participantIds =
    members.length > 0
      ? Array.from(new Set([currentUserId, ...members.map((m) => m.userId)]))
      : [currentUserId, partner.id];

  return {
    id,
    type: dto.type ?? existing?.type ?? 'DIRECT',
    participantIds,
    partner,
    lastMessage: existing?.lastMessage ?? 'Bắt đầu cuộc trò chuyện',
    lastMessageTime: formatChatTime(dto.created_at),
    unreadCount: existing?.unreadCount ?? 0,
    unreadCounts: existing?.unreadCounts ?? { [currentUserId]: 0 },
    isHidden: existing?.isHidden ?? false,
    muted: existing?.muted ?? false,
    memberCount: members.length || existing?.memberCount,
    members,
    messages: existing?.messages ?? [],
  };
}
