import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../../demo/context/AppContext';
import { tabPaths } from '../../../app/routes';
import type { SubjectResponse } from '../../../api';
import { proposalGateway } from '../../proposals/proposalGateway';
import { BookOpen, CheckCircle, Clock, Eye } from 'lucide-react';

type SessionStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED';

const STATUS_ITEMS: {
  status: SessionStatus;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { status: 'PENDING', label: 'Chờ duyệt', icon: Clock, color: 'text-fb-warning' },
  { status: 'REVIEWING', label: 'Đang duyệt', icon: Eye, color: 'text-fb-blue' },
  { status: 'RESOLVED', label: 'Đã xử lý', icon: CheckCircle, color: 'text-fb-success' },
];

type StatusCounts = Record<SessionStatus, number>;

/** Đếm phiên theo trạng thái (gateway đọc hết các trang của từng trạng thái). */
async function fetchStatusCounts(): Promise<StatusCounts | null> {
  try {
    const list = await proposalGateway.getMySubmissions({});
    return Object.fromEntries(
      STATUS_ITEMS.map(({ status }) => [
        status,
        list.filter((s) => s.status === status).length,
      ]),
    ) as StatusCounts;
  } catch {
    return null; // hiển thị "–" thay vì một con số sai
  }
}

export const StudentSidebarSections: React.FC = () => {
  const { setSelectedSubject, setActiveTab } = useApp();
  const navigate = useNavigate();
  const [statusCounts, setStatusCounts] = useState<
    StatusCounts | null | 'loading'
  >('loading');
  const [subjects, setSubjects] = useState<SubjectResponse[] | null>(null);
  const [subjectsFailed, setSubjectsFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchStatusCounts().then((counts) => {
      if (!cancelled) setStatusCounts(counts);
    });
    proposalGateway
      .getEnrolledSubjects()
      .then((data) => {
        if (!cancelled) setSubjects(data);
      })
      .catch(() => {
        if (!cancelled) setSubjectsFailed(true);
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
            const count =
              statusCounts === 'loading' ? '…' : (statusCounts?.[status] ?? '–');
            return (
              <button
                key={status}
                onClick={() => openSubmissions(status)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-fb-btn-hover/60 transition text-left cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${color}`} />
                  {label}
                </span>
                <span className="text-xs font-bold text-fb-text-2 bg-fb-input px-2 py-0.5 rounded-full min-w-6 text-center">
                  {count}
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
            <p className="px-3 py-2 text-xs text-fb-text-3">
              {subjectsFailed ? 'Không tải được danh sách môn học.' : 'Đang tải...'}
            </p>
          )}
          {subjects?.length === 0 && (
            <p className="px-3 py-2 text-xs text-fb-text-3">
              Bạn chưa tham gia lớp học phần nào.
            </p>
          )}
          {subjects?.map((subject) => (
            <button
              key={subject.subject_id ?? subject.code}
              onClick={() => openSubjectBank(subject)}
              title={`Xem ngân hàng đề môn ${subject.name}`}
              className="w-full group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-fb-btn-hover/60 transition text-left cursor-pointer"
            >
              <div className="w-9 h-9 shrink-0 rounded-lg bg-fb-blue-soft text-fb-blue flex items-center justify-center">
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
