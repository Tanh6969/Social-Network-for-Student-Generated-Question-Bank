import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BookOpenCheck,
  CheckCircle2,
  Database,
  Download,
  Edit3,
  Info,
  ListChecks,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useApp } from '../../demo/context/AppContext';
import { tabPaths } from '../../../app/routes';
import { errorMessage, type SubjectResponse } from '../../../api';
import { proposalGateway } from '../../proposals/proposalGateway';
import type { DemoBankQuestion } from '../../proposals/demoStore';
import { EditQuestionModal } from './EditQuestionModal';
import { QuestionAiRefineModal } from './QuestionAiRefineModal';

/**
 * Ngân hàng đề của môn học = các câu hỏi giảng viên đã chọn (APPROVED) từ bộ
 * câu hỏi của sinh viên. Ngân hàng dùng chung cho giảng viên dạy cùng môn.
 *
 * Swagger không có endpoint trả danh sách câu trong ngân hàng dạng JSON, nên
 * với phiên thật trang này dẫn sang sinh đề tự động và xuất file ngân hàng.
 */
export const LecturerBankView: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState<DemoBankQuestion | null>(null);
  const [refining, setRefining] = useState<DemoBankQuestion | null>(null);

  useEffect(() => {
    proposalGateway
      .getAllSubjects()
      .then(setSubjects)
      .catch((err: unknown) =>
        showToast(
          errorMessage(err, 'Không tải được danh sách môn học.'),
          'error',
        ),
      );
  }, [showToast]);

  // version đổi sau mỗi lần sửa / AI tinh chỉnh để đọc lại kho.
  const bank = useMemo(
    () => proposalGateway.listBankQuestions(subjectId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subjectId, version],
  );
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!bank || !q) return bank;
    return bank.filter(
      (item) =>
        item.content.toLowerCase().includes(q) ||
        item.session_title.toLowerCase().includes(q) ||
        item.author_name.toLowerCase().includes(q),
    );
  }, [bank, search]);

  const goToExams = (view: 'GENERATE' | 'EXPORT_BANK') =>
    navigate(`${tabPaths.exams}?view=${view}`);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-4 px-2 py-4 sm:px-4 lg:px-6">
      {/* Header */}
      <div className="rounded-lg bg-fb-card p-5 shadow-fb-card">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-fb-text sm:text-2xl">
              <span className="rounded-lg bg-fb-blue p-2.5 text-white">
                <Database className="h-5 w-5" />
              </span>
              Ngân hàng đề
            </h1>
            <p className="text-sm text-fb-text-2">
              Các câu hỏi đã được chọn từ bộ câu hỏi của sinh viên, dùng để sinh
              đề thi. Ngân hàng tính theo môn học và dùng chung cho các giảng
              viên dạy cùng môn.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(tabPaths.review)}
              className="flex items-center gap-2 rounded-lg border border-fb-divider px-3.5 py-2 text-sm font-semibold text-fb-text hover:bg-fb-hover"
            >
              <ListChecks className="h-4 w-4" />
              Chọn thêm câu từ bộ câu hỏi
            </button>
            <button
              type="button"
              onClick={() => goToExams('EXPORT_BANK')}
              className="flex items-center gap-2 rounded-lg border border-fb-divider px-3.5 py-2 text-sm font-semibold text-fb-text hover:bg-fb-hover"
            >
              <Download className="h-4 w-4" />
              Xuất file ngân hàng
            </button>
            <button
              type="button"
              onClick={() => goToExams('GENERATE')}
              className="flex items-center gap-2 rounded-lg bg-fb-blue px-3.5 py-2 text-sm font-semibold text-white hover:bg-fb-blue-hover"
            >
              <Wand2 className="h-4 w-4" />
              Sinh đề tự động
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg bg-fb-card p-3 shadow-fb-card sm:flex-row">
        <select
          value={subjectId ?? ''}
          onChange={(e) =>
            setSubjectId(e.target.value ? Number(e.target.value) : undefined)
          }
          className="rounded-lg border border-fb-divider bg-fb-input px-3 py-2 text-sm font-semibold text-fb-text sm:w-72"
          aria-label="Môn học"
        >
          <option value="">Tất cả môn học</option>
          {subjects.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>
              {s.code ? `${s.code} · ` : ''}
              {s.name}
            </option>
          ))}
        </select>
        {bank && (
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-fb-text-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo nội dung, bộ câu hỏi, tác giả…"
              className="w-full rounded-lg border border-fb-divider bg-fb-input py-2 pl-9 pr-3 text-sm text-fb-text"
            />
          </div>
        )}
      </div>

      {/* Phiên thật: chưa có API liệt kê ngân hàng */}
      {bank === null && (
        <div className="flex items-start gap-3 rounded-lg border border-fb-blue/30 bg-fb-blue-soft p-4 text-sm text-fb-blue">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">
              Chưa xem được danh sách câu trong ngân hàng trên giao diện
            </p>
            <p>
              Hệ thống hiện chỉ cung cấp xuất ngân hàng ra file PDF / Excel và
              sinh đề tự động từ các câu đã chọn. Dùng hai nút ở trên để làm
              việc với ngân hàng của môn.
            </p>
          </div>
        </div>
      )}

      {/* Demo: danh sách câu đã chọn */}
      {visible && (
        <div className="space-y-3">
          <p className="px-1 text-sm text-fb-text-2">
            <b className="text-fb-text">{visible.length}</b> câu hỏi trong ngân
            hàng
            {subjectId ? ' của môn đã chọn' : ''}
          </p>
          {visible.length === 0 && (
            <div className="rounded-lg border border-fb-divider bg-fb-card p-10 text-center text-sm text-fb-text-2">
              Chưa có câu hỏi nào. Hãy mở mục “Chọn câu vào ngân hàng đề” để
              chọn câu từ các bộ câu hỏi sinh viên đã đăng.
            </div>
          )}
          {visible.map((q) => (
            <article
              key={q.question_id}
              className="space-y-3 rounded-lg bg-fb-card p-4 shadow-fb-card"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-fb-blue-soft px-2.5 py-0.5 font-semibold text-fb-blue">
                  {q.subject_name}
                </span>
                <span className="text-fb-text-2">
                  Từ bộ “{q.session_title}” · {q.author_name}
                </span>
                {q.edited_by_lecturer && (
                  <span className="flex items-center gap-1 font-semibold text-fb-success">
                    <BookOpenCheck className="h-3.5 w-3.5" /> Đã được giảng viên
                    chỉnh sửa
                  </span>
                )}
                <span className="ml-auto tabular-nums text-fb-text-3">
                  #{q.question_id}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm font-medium text-fb-text [overflow-wrap:anywhere]">
                {q.content}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((o) => (
                  <div
                    key={o.key}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-sm ${
                      o.is_correct
                        ? 'border-fb-success bg-fb-success-soft font-semibold text-fb-success'
                        : 'border-fb-divider text-fb-text'
                    }`}
                  >
                    <span className="font-bold">{o.key}.</span>
                    <span className="flex-1 [overflow-wrap:anywhere]">
                      {o.text}
                    </span>
                    {o.is_correct && (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              {q.explanation && (
                <p className="whitespace-pre-wrap rounded-lg bg-fb-input p-3 text-sm text-fb-text-2">
                  <span className="font-semibold text-fb-text">Lời giải: </span>
                  {q.explanation}
                </p>
              )}
              <div className="flex justify-end gap-2 border-t border-fb-divider pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => setRefining(q)}
                  className="flex items-center gap-1.5 rounded-lg border border-fb-blue/30 px-3 py-1.5 font-semibold text-fb-blue hover:bg-fb-blue-soft"
                >
                  <Sparkles className="h-3.5 w-3.5" /> AI tinh chỉnh
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(q)}
                  className="flex items-center gap-1.5 rounded-lg border border-fb-divider px-3 py-1.5 font-semibold text-fb-text hover:bg-fb-hover"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Chỉnh sửa
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <EditQuestionModal
        isOpen={editing !== null}
        question={
          editing && {
            question_id: editing.question_id,
            content: editing.content,
            options: editing.options,
            explanation: editing.explanation,
            status: 'APPROVED',
          }
        }
        onClose={() => setEditing(null)}
        onSaved={() => setVersion((v) => v + 1)}
        showToast={showToast}
      />

      {refining && (
        <QuestionAiRefineModal
          question={refining}
          onClose={() => setRefining(null)}
          onApplied={() => setVersion((v) => v + 1)}
          showToast={showToast}
        />
      )}
    </div>
  );
};
