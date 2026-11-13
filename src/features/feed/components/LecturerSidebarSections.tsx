import React, { useEffect, useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { examsApi, errorMessage, CourseClassResponse } from '../../../api';
import { proposalGateway } from '../../proposals/proposalGateway';
import { ClassStudentsModal } from '../../lecturer/components/ClassStudentsModal';
import { ChevronRight, ClipboardCheck, Gamepad2 } from 'lucide-react';

// Màu nhận diện theo môn học, xoay vòng theo subject_id
const SUBJECT_COLORS = [
  'bg-fb-blue',
  'bg-fb-success',
  'bg-fb-warning',
  'bg-fb-blue',
  'bg-fb-danger',
  'bg-fb-blue',
];

export const LecturerSidebarSections: React.FC = () => {
  const { setActiveTab } = useApp();
  const [pendingCount, setPendingCount] = useState<string | null>(null);
  const [classes, setClasses] = useState<CourseClassResponse[] | null>(null);
  const [openClass, setOpenClass] = useState<CourseClassResponse | null>(null);
  const [classesError, setClassesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Phiên PENDING/REVIEWING (đọc hết các trang; phiên demo dùng kho demo)
    proposalGateway
      .getPendingSessions()
      .then((items) => {
        if (!cancelled) setPendingCount(String(items.length));
      })
      .catch(() => !cancelled && setPendingCount(null));
    examsApi
      .getMyCourseClasses()
      .then((data) => !cancelled && setClasses(data))
      .catch((err: unknown) => {
        if (!cancelled) setClassesError(errorMessage(err, 'Không tải được danh sách lớp.'));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* Cần duyệt — GET /sessions/pending */}
      <button
        onClick={() => setActiveTab('review')}
        className="w-full group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-fb-btn-hover/60 transition text-left cursor-pointer"
      >
        <span className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-fb-warning-soft text-fb-warning flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </span>
          Bộ câu hỏi cần xem xét
        </span>
        {pendingCount && pendingCount !== '0' && (
          <span className="text-xs font-bold text-white bg-fb-danger px-2 py-0.5 rounded-full">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Điều hành 6 Minigame */}
      <button
        onClick={() => setActiveTab('game')}
        className="w-full group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-fb-btn-hover/60 transition text-left cursor-pointer mt-1"
      >
        <span className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-fb-blue-soft text-fb-blue flex items-center justify-center">
            <Gamepad2 className="w-5 h-5" />
          </span>
          Điều hành 6 Minigame
        </span>
        <span className="text-[11px] font-bold text-fb-blue bg-fb-blue-soft px-2 py-0.5 rounded-full">
          Vận hành
        </span>
      </button>

      {/* Lớp phụ trách — GET /lecturer/course-classes/my-classes */}
      <div className="pt-3 mt-2 border-t border-fb-divider">
        <h4 className="px-3 pb-1 text-xs font-semibold text-fb-text-2">
          Lớp phụ trách
        </h4>
        {classesError && (
          <p role="alert" className="px-3 py-2 text-xs text-fb-danger">
            {classesError}
          </p>
        )}
        {classes === null && !classesError && (
          <p className="px-3 py-2 text-xs text-fb-text-3">Đang tải...</p>
        )}
        {classes?.length === 0 && (
          <p className="px-3 py-2 text-xs text-fb-text-3">Học kỳ này bạn chưa phụ trách lớp nào.</p>
        )}
        {classes?.map((cls) => (
          <button
            key={cls.course_class_id ?? cls.class_code}
            onClick={() => setOpenClass(cls)}
            title={`${cls.subject_code} · ${cls.subject_name} · ${cls.total_students ?? 0} sinh viên`}
            className="w-full group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-fb-btn-hover/60 transition text-left cursor-pointer"
          >
            <span
              className={`w-2 h-2 shrink-0 rounded-full ${SUBJECT_COLORS[(cls.subject_id ?? 0) % SUBJECT_COLORS.length]}`}
            />
            <span className="flex-1 min-w-0 truncate">{cls.subject_name}</span>
            <span className="shrink-0 tabular-nums text-xs text-fb-text-3">{cls.class_code}</span>
            <ChevronRight className="w-4 h-4 shrink-0 text-fb-text-3 group-hover:text-fb-text-2 transition-colors" />
          </button>
        ))}
      </div>

      {openClass && (
        <ClassStudentsModal courseClass={openClass} onClose={() => setOpenClass(null)} />
      )}
    </>
  );
};
