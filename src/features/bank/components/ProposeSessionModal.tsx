import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Eye,
  Send,
  Sparkles
} from 'lucide-react';
import { QuestionDifficulty } from '../../demo/types';

interface FormQuestion {
  content: string;
  options: { id: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: QuestionDifficulty;
}

export const ProposeSessionModal: React.FC = () => {
  const {
    isProposeSessionModalOpen,
    setIsProposeSessionModalOpen,
    createProposeSession,
    currentUser,
    showToast
  } = useApp();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mạng máy tính');
  const [chapter, setChapter] = useState('Chương 3: Tầng Giao vận & Điều khiển tắc nghẽn');
  const [questionsList, setQuestionsList] = useState<FormQuestion[]>([
    {
      content: 'Trong giao thức TCP, cờ (Flag) nào được sử dụng để khởi tạo quá trình bắt tay 3 bước?',
      options: [
        { id: 'A', text: 'SYN' },
        { id: 'B', text: 'ACK' },
        { id: 'C', text: 'FIN' },
        { id: 'D', text: 'RST' }
      ],
      correctAnswer: 'A',
      explanation: 'Bên khởi tạo gửi gói tin mang cờ SYN = 1 để đồng bộ số thứ tự chuỗi ban đầu (ISN).',
      difficulty: 'EASY'
    }
  ]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  if (!isProposeSessionModalOpen) return null;

  const currentQ = questionsList[activeQuestionIndex] || questionsList[0];

  const handleUpdateQuestion = (updates: Partial<FormQuestion>) => {
    setQuestionsList((prev) =>
      prev.map((q, idx) => (idx === activeQuestionIndex ? { ...q, ...updates } : q))
    );
  };

  const handleUpdateOption = (optId: 'A' | 'B' | 'C' | 'D', text: string) => {
    const updatedOptions = currentQ.options.map((opt) =>
      opt.id === optId ? { ...opt, text } : opt
    );
    handleUpdateQuestion({ options: updatedOptions });
  };

  const handleAddQuestion = () => {
    const newQ: FormQuestion = {
      content: '',
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' }
      ],
      correctAnswer: 'A',
      explanation: '',
      difficulty: 'MEDIUM'
    };
    setQuestionsList([...questionsList, newQ]);
    setActiveQuestionIndex(questionsList.length);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questionsList.length <= 1) {
      showToast('Phiên đề xuất cần tối thiểu 1 câu hỏi', 'warning');
      return;
    }
    setQuestionsList(questionsList.filter((_, i) => i !== idx));
    setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề cho phiên đề xuất', 'warning');
      return;
    }
    for (const q of questionsList) {
      if (!q.content.trim()) {
        showToast('Vui lòng điền nội dung câu hỏi', 'warning');
        return;
      }
    }

    const formattedQuestions = questionsList.map((q) => ({
      subject,
      chapter,
      content: q.content,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty
    }));

    createProposeSession(title, subject, chapter, formattedQuestions);
    setIsProposeSessionModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-[#1E1F20]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              +
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                Đề xuất phiên câu hỏi thi mới (BANK.02)
              </h3>
              <p className="text-xs text-gray-500">
                Sinh viên biên soạn → Giảng viên kiểm duyệt → Đóng góp vào ngân hàng trường
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsProposeSessionModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 CỘT SPLIT (Trái form, Phải xem trước trực tiếp) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700">
          {/* CỘT TRÁI: Form soạn thảo (7 cols) */}
          <div className="lg:col-span-7 p-5 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Tiêu đề phiên đề xuất *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bộ 3 câu trắc nghiệm Tầng Giao vận & Bắt tay 3 bước TCP"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Môn học
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100"
                  >
                    <option value="Mạng máy tính">Mạng máy tính</option>
                    <option value="Cấu trúc dữ liệu & Giải thuật">Cấu trúc dữ liệu & Giải thuật</option>
                    <option value="Cơ sở dữ liệu">Cơ sở dữ liệu</option>
                    <option value="Giải tích 1">Giải tích 1</option>
                    <option value="Hệ điều hành">Hệ điều hành</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Chương học
                  </label>
                  <input
                    type="text"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Stepper / Tabs chọn câu */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-500">Các câu hỏi:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {questionsList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                      activeQuestionIndex === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm câu
                </button>
              </div>

              {questionsList.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(activeQuestionIndex)}
                  className="ml-auto text-red-500 hover:text-red-700 p-1 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa câu này
                </button>
              )}
            </div>

            {/* Content of selected question */}
            <div className="space-y-3 bg-gray-50 dark:bg-[#1E1F20] p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nội dung câu hỏi #{activeQuestionIndex + 1} *
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                  value={currentQ.content}
                  onChange={(e) => handleUpdateQuestion({ content: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 4 options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  4 Phương án lựa chọn & Đánh dấu đáp án đúng:
                </label>
                {currentQ.options.map((opt) => (
                  <div key={opt.id} className="flex items-start gap-2">
                    <input
                      type="radio"
                      name={`correct_${activeQuestionIndex}`}
                      checked={currentQ.correctAnswer === opt.id}
                      onChange={() => handleUpdateQuestion({ correctAnswer: opt.id })}
                      className="w-4 h-4 text-blue-600 mt-2 shrink-0 cursor-pointer"
                      title="Chọn làm đáp án đúng"
                    />
                    <span className="w-5 font-bold text-xs mt-2 shrink-0">{opt.id}.</span>
                    <textarea
                      rows={2}
                      placeholder={`Nội dung phương án ${opt.id}...`}
                      value={opt.text}
                      onChange={(e) => handleUpdateOption(opt.id, e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100 resize-y min-h-[38px] break-words leading-relaxed"
                    />
                  </div>
                ))}
              </div>

              {/* Explanation & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Độ khó
                  </label>
                  <select
                    value={currentQ.difficulty}
                    onChange={(e) =>
                      handleUpdateQuestion({ difficulty: e.target.value as QuestionDifficulty })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100"
                  >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Giải thích đáp án
                  </label>
                  <input
                    type="text"
                    placeholder="Giải thích vì sao đáp án này đúng..."
                    value={currentQ.explanation}
                    onChange={(e) => handleUpdateQuestion({ explanation: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Xem trước trực tiếp (Live Preview, 5 cols) */}
          <div className="lg:col-span-5 p-5 bg-[#F9FAFB] dark:bg-[#18191A] flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Xem trước dạng đề thi thực tế</span>
            </div>

            <div className="bg-white dark:bg-[#242526] rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-md space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                  {subject}
                </span>
                <span className="font-semibold text-gray-500">
                  Độ khó: {currentQ.difficulty === 'EASY' ? 'Dễ' : currentQ.difficulty === 'MEDIUM' ? 'Trung bình' : 'Khó'}
                </span>
              </div>

              <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100">
                Câu {activeQuestionIndex + 1}: {currentQ.content || '... (Chưa nhập nội dung câu hỏi)'}
              </h4>

              <div className="space-y-1.5 text-xs">
                {currentQ.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-2 rounded-lg border text-xs flex items-start justify-between gap-2 ${
                      opt.id === currentQ.correctAnswer
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-semibold'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="flex-1 break-words whitespace-pre-wrap leading-relaxed">
                      <strong>{opt.id}.</strong> {opt.text || '...'}
                    </span>
                    {opt.id === currentQ.correctAnswer && (
                      <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold shrink-0 mt-0.5">
                        ĐÚNG
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {currentQ.explanation && (
                <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg text-[11px] text-blue-900 dark:text-blue-200">
                  <strong>Giải thích: </strong> {currentQ.explanation}
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-[10px] text-gray-400">
                <span>Người biên soạn: {currentUser.name}</span>
                <span>Trạng thái: Dự thảo</span>
              </div>
            </div>

            <div className="mt-auto pt-4 text-xs text-gray-500 space-y-1">
              <p>💡 <strong>Lưu ý:</strong> Câu hỏi được duyệt sẽ giúp bạn nhận +50 điểm cống hiến và mở khoá các khung avatar độc quyền.</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1F20] flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsProposeSessionModalOpen(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Gửi Hội đồng Giảng viên phê duyệt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
