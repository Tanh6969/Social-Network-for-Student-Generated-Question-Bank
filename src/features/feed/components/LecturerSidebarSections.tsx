import React, { useEffect, useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { reviewApi, examsApi, CourseClassResponse } from '../../../api';
import { ClassStudentsModal } from '../../lecturer/components/ClassStudentsModal';
import { ChevronRight, ClipboardCheck } from 'lucide-react';

// limit tối đa của GET /sessions/pending
const PENDING_LIMIT = 50;

// Màu nhận diện theo môn học, xoay vòng theo subject_id
const SUBJECT_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-cyan-500',
];

export const LecturerSidebarSections: React.FC = () => {
  const { setActiveTab } = useApp();
  const [pendingCount, setPendingCount] = useState<string | null>(null);
  const [classes, setClasses] = useState<CourseClassResponse[] | null>(null);
  const [openClass, setOpenClass] = useState<CourseClassResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Các wrapper API đã tự fallback sang mock khi backend chưa sẵn sàng
    reviewApi
      .getPendingSessions({ limit: PENDING_LIMIT })
      .then((res) => {
        if (cancelled) return;
        const count = (res.items ?? []).filter((s) => s.status !== 'RESOLVED').length;
        setPendingCount(`${count}${res.pagination?.has_next ? '+' : ''}`);
      })
      .catch(() => !cancelled && setPendingCount(null));
    examsApi
      .getMyCourseClasses()
      .then((data) => !cancelled && setClasses(data))
      .catch(() => !cancelled && setClasses([]));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* Cần duyệt — GET /sessions/pending */}
      <button
        onClick={() => setActiveTab('review')}
        className="w-full group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] transition text-left cursor-pointer"
      >
        <span className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </span>
          Cần duyệt
        </span>
        {pendingCount && pendingCount !== '0' && (
          <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Lớp phụ trách — GET /lecturer/course-classes/my-classes */}
      <div className="pt-3 mt-2 border-t border-fb-divider">
        <h4 className="px-3 pb-1 text-xs font-semibold text-fb-text-2">
          Lớp phụ trách
        </h4>
        {classes === null && <p className="px-3 py-2 text-xs text-gray-400">Đang tải...</p>}
        {classes?.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-400">Học kỳ này bạn chưa phụ trách lớp nào.</p>
        )}
        {classes?.map((cls) => (
          <button
            key={cls.course_class_id ?? cls.class_code}
            onClick={() => setOpenClass(cls)}
            title={`${cls.subject_code} · ${cls.subject_name} · ${cls.total_students ?? 0} sinh viên`}
            className="w-full group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] transition text-left cursor-pointer"
          >
            <span
              className={`w-2 h-2 shrink-0 rounded-full ${SUBJECT_COLORS[(cls.subject_id ?? 0) % SUBJECT_COLORS.length]}`}
            />
            <span className="flex-1 min-w-0 truncate">{cls.subject_name}</span>
            <span className="shrink-0 tabular-nums text-xs text-gray-400">{cls.class_code}</span>
            <ChevronRight className="w-4 h-4 shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        ))}
      </div>

      {openClass && (
        <ClassStudentsModal courseClass={openClass} onClose={() => setOpenClass(null)} />
      )}
    </>
  );
};
