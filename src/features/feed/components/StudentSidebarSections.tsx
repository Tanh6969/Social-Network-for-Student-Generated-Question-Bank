import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../../demo/context/AppContext';
import { tabPaths } from '../../../app/routes';
import { sessionsApi, SubjectResponse } from '../../../api';
import { getStoredSubmissions } from '../../propose/mockSessions';
import { BookOpen, CheckCircle, Clock, Eye } from 'lucide-react';

type SessionStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED';

// limit tối đa của GET /sessions/my-submissions
const COUNT_LIMIT = 50;

const STATUS_ITEMS: {
  status: SessionStatus;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { status: 'PENDING', label: 'Chờ duyệt', icon: Clock, color: 'text-amber-500' },
  { status: 'REVIEWING', label: 'Đang duyệt', icon: Eye, color: 'text-blue-500' },
  { status: 'RESOLVED', label: 'Đã xử lý', icon: CheckCircle, color: 'text-green-500' },
];

// Fallback môn học khi backend chưa sẵn sàng (giống ProposeView)
const MOCK_SUBJECTS: SubjectResponse[] = [
  { subject_id: 10, code: 'IT3180', name: 'Nhập môn Công nghệ phần mềm' },
  { subject_id: 11, code: 'IT3080', name: 'Mạng máy tính & Truyền thông' },
  { subject_id: 12, code: 'IT3011', name: 'Cấu trúc dữ liệu và giải thuật' },
  { subject_id: 13, code: 'IT3040', name: 'Kiến trúc máy tính & Hệ điều hành' },
];

type StatusCount = { count: number; hasMore: boolean };

async function fetchStatusCounts(): Promise<Record<SessionStatus, StatusCount>> {
  try {
    const results = await Promise.all(
      STATUS_ITEMS.map(({ status }) =>
        sessionsApi.getMySubmissions({ status, limit: COUNT_LIMIT }),
      ),
    );
    return Object.fromEntries(
      STATUS_ITEMS.map(({ status }, i) => [
        status,
        {
          count: results[i].contents?.length ?? 0,
          hasMore: results[i].pagination?.has_next ?? false,
        },
      ]),
    ) as Record<SessionStatus, StatusCount>;
  } catch {
    // Fallback mock submissions đã lưu cục bộ
    const stored = getStoredSubmissions();
    return Object.fromEntries(
      STATUS_ITEMS.map(({ status }) => [
        status,
        {
          count: stored.filter((s) => (s.status ?? 'PENDING') === status).length,
          hasMore: false,
        },
      ]),
    ) as Record<SessionStatus, StatusCount>;
  }
}

export const StudentSidebarSections: React.FC = () => {
  const { setSelectedSubject, setActiveTab } = useApp();
  const navigate = useNavigate();
  const [statusCounts, setStatusCounts] =
    useState<Record<SessionStatus, StatusCount> | null>(null);
  const [subjects, setSubjects] = useState<SubjectResponse[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchStatusCounts().then((counts) => {
      if (!cancelled) setStatusCounts(counts);
    });
    sessionsApi
      .getMyEnrolledSubjects()
      .catch(() => MOCK_SUBJECTS)
      .then((data) => {
        if (!cancelled) setSubjects(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openSubmissions = (status: SessionStatus) =>
    navigate(`${tabPaths.propose}?view=my-submissions&status=${status}`);

  const openSubjectBank = (subject: SubjectResponse) => {
    setSelectedSubject(subject.code ?? subject.name ?? 'Tất cả môn học');
    setActiveTab('bank');
  };

  return (
    <>
      {/* Câu hỏi của tôi — GET /sessions/my-submissions */}
      <div className="pt-3 border-t border-fb-divider">
        <h4 className="px-3 pb-1.5 text-xs font-bold text-fb-text-2">
          Câu hỏi của tôi
        </h4>
        <div className="space-y-0.5 text-sm font-medium text-fb-text">
          {STATUS_ITEMS.map(({ status, label, icon: Icon, color }) => {
            const item = statusCounts?.[status];
            return (
              <button
                key={status}
                onClick={() => openSubmissions(status)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] transition text-left cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${color}`} />
                  {label}
                </span>
                <span className="text-xs font-bold text-gray-500 bg-fb-input px-2 py-0.5 rounded-full min-w-6 text-center">
                  {item
                    ? `${item.count}${item.hasMore ? '+' : ''}`
                    : '…'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Môn học của tôi — GET /sessions/my-enrolled-subjects */}
      <div className="pt-3 border-t border-fb-divider">
        <h4 className="px-3 pb-1.5 text-xs font-bold text-fb-text-2">
          Môn học của tôi
        </h4>
        <div className="space-y-0.5 text-sm font-medium text-fb-text">
          {subjects === null && (
            <p className="px-3 py-2 text-xs text-gray-400">Đang tải...</p>
          )}
          {subjects?.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-400">
              Bạn chưa tham gia lớp học phần nào.
            </p>
          )}
          {subjects?.map((subject) => (
            <button
              key={subject.subject_id ?? subject.code}
              onClick={() => openSubjectBank(subject)}
              title={`Xem ngân hàng đề môn ${subject.name}`}
              className="w-full group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] transition text-left cursor-pointer"
            >
              <div className="w-9 h-9 shrink-0 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-fb-blue flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate">{subject.name}</p>
                <p className="text-xs tabular-nums text-fb-text-2">
                  {subject.code}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
