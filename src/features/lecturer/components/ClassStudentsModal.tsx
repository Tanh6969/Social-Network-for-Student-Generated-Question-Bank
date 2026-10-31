import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Search, Users, X } from 'lucide-react';
import { examsApi, ClassStudentResponse, CourseClassResponse } from '../../../api';

interface ClassStudentsModalProps {
  courseClass: CourseClassResponse;
  onClose: () => void;
}

function getInitials(fullName?: string): string {
  const parts = (fullName ?? '').trim().split(/\s+/u);
  return parts.length ? parts[parts.length - 1].charAt(0).toUpperCase() : '?';
}

// Danh sách sinh viên của lớp học phần — GET /lecturer/course-classes/{courseClassId}/students
export const ClassStudentsModal: React.FC<ClassStudentsModalProps> = ({ courseClass, onClose }) => {
  const [students, setStudents] = useState<ClassStudentResponse[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    examsApi
      .getClassStudents(courseClass)
      .then((data) => !cancelled && setStudents(data))
      .catch(() => !cancelled && setStudents([]));
    return () => {
      cancelled = true;
    };
  }, [courseClass]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!students || !term) return students;
    return students.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(term) ||
        s.student_code?.includes(term) ||
        s.class_name?.toLowerCase().includes(term),
    );
  }, [students, query]);

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Danh sách sinh viên lớp ${courseClass.class_code}`}
        className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-xl w-full h-[80vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
              {courseClass.subject_code} · Lớp {courseClass.class_code}
            </p>
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 truncate">
              {courseClass.subject_name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {courseClass.semester_name && <>{courseClass.semester_name} · </>}
              {students ? students.length : courseClass.total_students ?? 0} sinh viên
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] flex items-center justify-center text-gray-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo họ tên, MSSV, lớp sinh hoạt..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-100 dark:bg-[#3A3B3C] text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered === null && (
            <p className="py-10 text-center text-sm text-gray-400">Đang tải danh sách...</p>
          )}
          {filtered?.length === 0 && (
            <div className="py-10 flex flex-col items-center gap-2 text-sm text-gray-400">
              <Users className="w-8 h-8" />
              {query ? 'Không tìm thấy sinh viên phù hợp.' : 'Lớp chưa có sinh viên nào.'}
            </div>
          )}
          {filtered?.map((student) => (
            <div
              key={student.user_id ?? student.student_code}
              className="group flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition"
            >
              <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-sm font-bold flex items-center justify-center">
                {getInitials(student.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {student.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  <span className="font-mono">{student.student_code}</span>
                  {student.class_name && <> · {student.class_name}</>}
                </p>
              </div>
              {student.email && (
                <a
                  href={`mailto:${student.email}`}
                  title={student.email}
                  aria-label={`Gửi email cho ${student.full_name}`}
                  className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
};
