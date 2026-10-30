import type { FriendStatus, Role } from '../demo/types';

export type ProfileRelationAction =
  | 'FOLLOW'
  | 'SEND_REQUEST'
  | 'CANCEL_REQUEST'
  | 'RESPOND_TO_REQUEST'
  | 'ALREADY_FRIENDS'
  | 'NONE';

export function getProfileRelationAction(
  viewerRole: Role,
  targetRole: Role,
  status: FriendStatus,
): ProfileRelationAction {
  if (targetRole === 'LECTURER') return 'FOLLOW';
  if (viewerRole !== 'STUDENT') return 'NONE';
  if (status === 'FRIEND') return 'ALREADY_FRIENDS';
  if (status === 'REQUEST_SENT') return 'CANCEL_REQUEST';
  if (status === 'REQUEST_RECEIVED') return 'RESPOND_TO_REQUEST';
  return 'SEND_REQUEST';
}
