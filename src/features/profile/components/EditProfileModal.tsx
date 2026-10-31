import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { User } from '../../demo/types';

type EditableProfile = Pick<User, 'name' | 'bio' | 'faculty' | 'classOrTitle'>;

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updates: EditableProfile) => void;
}

export function EditProfileModal({
  user,
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên hiển thị.');
      return;
    }
    onSave({
      name: form.name.trim(),
      bio: form.bio.trim(),
      faculty: form.faculty.trim(),
      classOrTitle: form.classOrTitle.trim(),
    });
  };

  const inputClassName =
    'w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-hidden transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-[#3A3B3C] dark:text-gray-100';
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
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-[#242526]"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div>
            <h2
              id="edit-profile-title"
              className="text-lg font-bold text-fb-text"
            >
              Chỉnh sửa trang cá nhân
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Cập nhật thông tin giới thiệu và học tập của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chỉnh sửa"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <div className="space-y-6 overflow-y-auto px-5 py-5">
            <section className="space-y-4">
              <h3 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-900 dark:border-gray-700 dark:text-gray-100">
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
                <p className="mt-1 text-right text-xs text-gray-400">
                  {form.bio.length}/240
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-900 dark:border-gray-700 dark:text-gray-100">
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
            </section>

            <section className="space-y-2">
              <h3 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-900 dark:border-gray-700 dark:text-gray-100">
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
                <p className="mt-1 text-xs text-gray-500">
                  Email và vai trò do tài khoản trường quản lý.
                </p>
              </div>
            </section>

            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
              Thay đổi hồ sơ trong bản demo chỉ được lưu trong phiên trình duyệt.
            </p>
            {error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}
          </div>

          <footer className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-[#3A3B3C] dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Lưu thay đổi
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
