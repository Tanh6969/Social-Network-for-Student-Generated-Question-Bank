import React, { useState } from 'react';
import { Question } from '../../demo/types';
import { useApp } from '../../demo/context/AppContext';
import {
  X,
  Edit3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Save,
  Tag,
  BookOpen
} from 'lucide-react';

interface EditQuestionModalProps {
  question: Question | null;
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  question,
  sessionId,
  isOpen,
  onClose
}) => {
  const { editQuestionByLecturer } = useApp();

  if (!isOpen || !question) return null;

  const [content, setContent] = useState(question.content);
  const [options, setOptions] = useState(question.options);
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>(question.correctAnswer);
  const [explanation, setExplanation] = useState(question.explanation);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>(question.difficulty);
  const [chapter, setChapter] = useState(question.chapter);
  const [activeTab, setActiveTab] = useState<'EDIT' | 'DIFF'>('EDIT');

  const handleOptionTextChange = (id: 'A' | 'B' | 'C' | 'D', text: string) => {
    setOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const handleSave = () => {
    if (!content.trim()) return;

    editQuestionByLecturer(question.id, {
      content,
      options,
      correctAnswer,
      explanation,
      difficulty,
      chapter
    });

    onClose();
  };

  const hasChanged =
    content !== question.content ||
    correctAnswer !== question.correctAnswer ||
    explanation !== question.explanation ||
    difficulty !== question.difficulty ||
    chapter !== question.chapter ||
    options.some((opt, idx) => opt.text !== question.options[idx]?.text);

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-[#2B2738] dark:to-[#1E202B]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <Edit3 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  Hiệu Đính & Chỉnh Sửa Câu Hỏi
                </h3>
                {/* Visual API badge matching user swagger */}
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  PUT /questions/{`{questionId}`}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mã câu hỏi: <span className="font-mono">{question.id}</span> • Môn học: {question.subject}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3 pb-0 border-b border-gray-200 dark:border-gray-700 flex gap-4 text-xs font-bold bg-gray-50/50 dark:bg-[#1E1F20]/50">
          <button
            onClick={() => setActiveTab('EDIT')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'EDIT'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Biểu mẫu chỉnh sửa trực tiếp</span>
          </button>
          <button
            onClick={() => setActiveTab('DIFF')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'DIFF'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đối chiếu thay đổi (Diff Preview)</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'EDIT' ? (
            <>
              {/* Meta row: Chapter & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span>Chương / Chuyên đề:</span>
                  </label>
                  <input
                    type="text"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>Mức độ nhận thức (Độ khó):</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['EASY', 'MEDIUM', 'HARD'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`py-2 text-center rounded-xl font-bold transition border ${
                          difficulty === lvl
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-gray-50 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {lvl === 'EASY' ? 'Dễ (Nhận biết)' : lvl === 'MEDIUM' ? 'TB (Thông hiểu)' : 'Khó (Vận dụng)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nội dung câu hỏi đề cương:
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 font-medium leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  placeholder="Nhập nội dung đề bài chính xác..."
                />
              </div>

              {/* Options list with correct answer radio */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-gray-700 dark:text-gray-300">
                    4 Phương án trắc nghiệm (Chọn radio để đánh dấu đáp án đúng):
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đáp án đúng: Phương án {correctAnswer}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition ${
                        opt.id === correctAnswer
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#2A2B2D]'
                      }`}
                    >
                      <label className="flex items-center gap-1.5 cursor-pointer pl-1">
                        <input
                          type="radio"
                          name="correct_answer_radio"
                          checked={opt.id === correctAnswer}
                          onChange={() => setCorrectAnswer(opt.id)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="font-black text-sm text-gray-800 dark:text-gray-200 w-5">
                          {opt.id}.
                        </span>
                      </label>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      />

                      {opt.id === correctAnswer && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shrink-0">
                          Đáp án đúng
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                  <span>Lời giải thích / Hướng dẫn giải chi tiết cho sinh viên:</span>
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  placeholder="Giải thích tại sao đáp án này đúng và các tài liệu tham khảo..."
                />
              </div>
            </>
          ) : (
            /* Diff Preview Tab */
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-800 dark:text-blue-200 flex items-center gap-2 border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-4 h-4 shrink-0 text-blue-600" />
                <span>
                  Bản so sánh giữa câu hỏi gốc do sinh viên đề xuất và bản biên tập chuẩn hóa của Giảng viên.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1F20] space-y-2">
                  <span className="font-bold text-gray-500 text-[11px] block uppercase">
                    Bản gốc ban đầu của sinh viên
                  </span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{question.content}</p>
                  <div className="space-y-1 pt-1">
                    {question.options.map((opt) => (
                      <p
                        key={opt.id}
                        className={`p-1.5 rounded text-[11px] ${
                          opt.id === question.correctAnswer ? 'font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <strong>{opt.id}.</strong> {opt.text}
                      </p>
                    ))}
                  </div>
                  <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <strong>Giải thích:</strong> {question.explanation}
                  </div>
                </div>

                {/* Edited */}
                <div className="p-4 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-700 dark:text-purple-300 text-[11px] block uppercase">
                      Bản sau khi Giảng viên biên tập
                    </span>
                    <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
                      Hiệu đính
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{content}</p>
                  <div className="space-y-1 pt-1">
                    {options.map((opt) => (
                      <p
                        key={opt.id}
                        className={`p-1.5 rounded text-[11px] ${
                          opt.id === correctAnswer ? 'font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <strong>{opt.id}.</strong> {opt.text}
                      </p>
                    ))}
                  </div>
                  <div className="text-[11px] text-purple-900 dark:text-purple-200 pt-2 border-t border-purple-200 dark:border-purple-800/40">
                    <strong>Giải thích chuẩn:</strong> {explanation}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1F20] flex items-center justify-between">
          <div className="text-gray-500 text-[11px]">
            {hasChanged ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">● Có thay đổi chưa lưu</span>
            ) : (
              <span>Chưa có thay đổi nào</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Lưu chỉnh sửa (PUT /questions/{`{id}`})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
