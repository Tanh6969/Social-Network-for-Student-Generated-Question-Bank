import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  FileCode,
  Plus,
  Download,
  Copy,
  Clock,
  Layers,
  CheckCircle2,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Exam } from '../../demo/types';

export const ExamsView: React.FC = () => {
  const { exams, setIsExamWizardOpen, showToast } = useApp();
  const [selectedExam, setSelectedExam] = useState<Exam>(exams[0] || null);
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-10 items-start">
      {/* CỘT TRÁI: Danh sách đề thi (sticky sát lề trái) */}
      <aside className="w-full lg:w-96 shrink-0 space-y-4 select-none lg:sticky lg:top-18">
        <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-purple-600" />
              <span>Đề thi đã sinh</span>
            </h2>
            <button
              onClick={() => setIsExamWizardOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Sinh đề mới</span>
            </button>
          </div>

          <div className="space-y-2">
            {exams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => setSelectedExam(exam)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedExam?.id === exam.id
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#3A3B3C]'
                }`}
              >
                <span className="text-[11px] font-medium bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md">
                  {exam.subject}
                </span>
                <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100 mt-1.5">
                  {exam.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2">
                  <span>{exam.totalQuestions} câu · {exam.durationMinutes} phút</span>
                  <span>{exam.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* CỘT PHẢI: Chi tiết đề thi & Xuất file */}
      <main className="flex-1 bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        {selectedExam ? (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 gap-3">
              <div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                  Chi tiết đề thi & Phân bổ ma trận
                </span>
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mt-0.5">
                  {selectedExam.title}
                </h3>
                <p className="text-xs text-gray-500">
                  Các mã đề đã trộn: <strong>{selectedExam.examCodes.join(', ')}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100"
                >
                  {showAnswers ? 'Ẩn đáp án' : 'Hiện đáp án'}
                </button>

                <button
                  onClick={() => showToast('Đang tải xuống bộ đề thi PDF kèm đáp án...', 'success')}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất file in (PDF)</span>
                </button>
              </div>
            </div>

            {/* Matrix preview */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl text-xs text-center border">
              <div>
                <span className="text-gray-500 block">Dễ</span>
                <strong className="text-emerald-600 text-sm">
                  {selectedExam.difficultyMatrix.easy} câu
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Trung bình</span>
                <strong className="text-amber-600 text-sm">
                  {selectedExam.difficultyMatrix.medium} câu
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Khó</span>
                <strong className="text-red-600 text-sm">
                  {selectedExam.difficultyMatrix.hard} câu
                </strong>
              </div>
            </div>

            {/* Questions preview */}
            <div className="space-y-4 pt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">
                Mẫu nội dung câu hỏi (Mã đề 101):
              </h4>

              {selectedExam.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526] space-y-2 text-xs"
                >
                  <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100">
                    <span>Câu {idx + 1}: {q.content}</span>
                    <span className="text-gray-400 font-normal">[{q.difficulty}]</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded-lg border ${
                          showAnswers && opt.id === q.correctAnswer
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 font-bold'
                            : 'border-gray-200 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <strong>{opt.id}.</strong> {opt.text}
                      </div>
                    ))}
                  </div>

                  {showAnswers && (
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 pt-1 border-t">
                      <strong>Đáp án đúng: {q.correctAnswer}</strong> – {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 py-12">Chưa chọn đề thi nào</div>
        )}
      </main>
    </div>
  );
};
