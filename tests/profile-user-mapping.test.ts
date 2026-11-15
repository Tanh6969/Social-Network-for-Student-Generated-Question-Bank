import { describe, expect, it } from 'vitest';
import { mapAuthUser, applyProfile } from '../src/features/auth/mapAuthUser';
import { userFromProfile } from '../src/features/friends/apiRelationships';

const profile = {
  user_id: 169,
  email: 'hieu.dv22980@sis.hust.edu.vn',
  full_name: 'Đồng Văn Hiếu',
  school_faculty: 'Trường Công nghệ Thông tin và Truyền thông',
  major: 'Khoa học máy tính',
  class_name: 'Khoa học máy tính 01-K67',
  role: 'STUDENT' as const,
};

describe('profile user mapping', () => {
  it('maps all education fields from the profile response for the signed-in user', () => {
    const user = applyProfile(
      mapAuthUser({
        user_id: 169,
        username: profile.email,
        role: 'STUDENT',
      }),
      profile,
    );

    expect(user).toMatchObject({
      faculty: profile.school_faculty,
      major: profile.major,
      classOrTitle: profile.class_name,
    });
  });

  it('does not use the student role as a substitute for a missing class name', () => {
    const user = applyProfile(
      mapAuthUser({
        user_id: 169,
        username: profile.email,
        role: 'STUDENT',
      }),
      { ...profile, class_name: undefined },
    );

    expect(user.classOrTitle).toBe('');
  });

  it('maps public profile education fields consistently', () => {
    expect(userFromProfile(profile)).toMatchObject({
      faculty: profile.school_faculty,
      major: profile.major,
      classOrTitle: profile.class_name,
    });
  });
});
