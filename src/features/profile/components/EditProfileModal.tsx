import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { User } from '../../demo/types';

type EditableProfile = Pick<User, 'name' | 'bio' | 'faculty' | 'classOrTitle'>;

interface EditProfileModalProps {
  user: User;
  persistToApi?: boolean;
  onClose: () => void;
  onSave: (updates: EditableProfile) => Promise<boolean>;
}

export function EditProfileModal({
  user,
  persistToApi = false,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [form, setForm] = useState<EditableProfile>({
    name: user.name,
    bio: user.bio,
    faculty: user.faculty,
    classOrTitle: user.classOrTitle,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateField = (field: keyof EditableProfile, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên hiển thị.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        bio: form.bio.trim(),
        faculty: form.faculty.trim(),
        classOrTitle: form.classOrTitle.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClassName =
    'w-full rounded-lg border border-fb-divider bg-fb-inset px-3 py-2.5 text-sm text-fb-text outline-hidden transition focus:border-fb-blue focus:ring-2 focus:ring-fb-blue/20';
  const labelClassName =
    'mb-1.5 block text-sm font-semibold text-fb-text';

  return (
    <div
      className="fixed inset-0 z-[270] flex items-center justify-center bg-black/60 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-fb-card shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-fb-divider px-5 py-4">
          <div>
            <h2
              id="edit-profile-title"
              className="text-lg font-bold text-fb-text"
            >
              Chỉnh sửa trang cá nhân
            </h2>
            <p className="mt-0.5 text-xs text-fb-text-2">
              Cập nhật thông tin giới thiệu và học tập của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chỉnh sửa"
            className="rounded-full p-2 text-fb-text-2 hover:bg-fb-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-col">
          <div className="space-y-6 overflow-y-auto px-5 py-5">
            <section className="space-y-4">
              <h3 className="border-b border-fb-divider pb-2 text-sm font-bold text-fb-text">
                Thông tin cá nhân
              </h3>
              <div>
                <label htmlFor="profile-display-name" className={labelClassName}>
                  Tên hiển thị
                </label>
                <input
                  id="profile-display-name"
                  autoFocus
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="profile-bio" className={labelClassName}>
                  Tiểu sử
                </label>
                <textarea
                  id="profile-bio"
                  rows={4}
                  maxLength={240}
                  value={form.bio}
                  onChange={(event) => updateField('bio', event.target.value)}
                  placeholder="Viết đôi điều về bạn..."
                  className={`${inputClassName} resize-y`}
                />
                <p className="mt-1 text-right text-xs text-fb-text-3">
                  {form.bio.length}/240
                </p>
              </div>
            </section>

            {!persistToApi && <section className="space-y-4">
              <h3 className="border-b border-fb-divider pb-2 text-sm font-bold text-fb-text">
                Học tập và công việc
              </h3>
              <div>
                <label htmlFor="profile-faculty" className={labelClassName}>
                  Khoa / đơn vị
                </label>
                <input
                  id="profile-faculty"
                  maxLength={100}
                  value={form.faculty}
                  onChange={(event) =>
                    updateField('faculty', event.target.value)
                  }
                  placeholder="Ví dụ: Khoa Công nghệ Thông tin"
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="profile-class-title" className={labelClassName}>
                  Lớp / chức danh
                </label>
                <input
                  id="profile-class-title"
                  maxLength={100}
                  value={form.classOrTitle}
                  onChange={(event) =>
                    updateField('classOrTitle', event.target.value)
                  }
                  placeholder="Ví dụ: K67 - CNTT 01"
                  className={inputClassName}
                />
              </div>
            </section>}

            <section className="space-y-2">
              <h3 className="border-b border-fb-divider pb-2 text-sm font-bold text-fb-text">
                Thông tin tài khoản
              </h3>
              <div>
                <label htmlFor="profile-email" className={labelClassName}>
                  Email trường
                </label>
                <input
                  id="profile-email"
                  value={user.email}
                  readOnly
                  className={`${inputClassName} cursor-not-allowed opacity-70`}
                />
                <p className="mt-1 text-xs text-fb-text-2">
                  Email và vai trò do tài khoản trường quản lý.
                </p>
              </div>
            </section>

            {!persistToApi && <p className="rounded-lg bg-fb-blue-soft px-3 py-2 text-xs text-fb-blue">
              Thay đổi hồ sơ trong bản demo chỉ được lưu trong phiên trình duyệt.
            </p>}
            {error && (
              <p role="alert" className="text-sm font-medium text-fb-danger">
                {error}
              </p>
            )}
          </div>

          <footer className="flex justify-end gap-2 border-t border-fb-divider px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-fb-input px-4 py-2 text-sm font-semibold text-fb-text hover:bg-fb-btn-hover"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-fb-blue px-5 py-2 text-sm font-semibold text-white hover:bg-fb-blue-hover"
            >
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
