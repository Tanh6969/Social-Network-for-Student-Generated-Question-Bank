import { describe, expect, it } from 'vitest';
import { getProfileRelationAction } from '../src/features/profile/profileRelations';

describe('profile relationship actions', () => {
  it('lets students connect with student profiles according to request status', () => {
    expect(getProfileRelationAction('STUDENT', 'STUDENT', 'NONE')).toBe(
      'SEND_REQUEST',
    );
    expect(getProfileRelationAction('STUDENT', 'STUDENT', 'REQUEST_SENT')).toBe(
      'CANCEL_REQUEST',
    );
    expect(
      getProfileRelationAction('STUDENT', 'STUDENT', 'REQUEST_RECEIVED'),
    ).toBe('RESPOND_TO_REQUEST');
    expect(getProfileRelationAction('STUDENT', 'STUDENT', 'FRIEND')).toBe(
      'ALREADY_FRIENDS',
    );
  });

  it('offers following on lecturer profiles and no student connection action to lecturers', () => {
    expect(getProfileRelationAction('STUDENT', 'LECTURER', 'NONE')).toBe(
      'FOLLOW',
    );
    expect(getProfileRelationAction('LECTURER', 'LECTURER', 'FRIEND')).toBe(
      'FOLLOW',
    );
    expect(getProfileRelationAction('LECTURER', 'STUDENT', 'NONE')).toBe(
      'NONE',
    );
  });
});
