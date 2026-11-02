import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  X,
  Sparkles,
  Check,
  RefreshCw,
  ArrowRight,
  Sliders,
  CheckCheck
} from 'lucide-react';
import { Question } from '../../demo/types';

export const AIRefineModal: React.FC = () => {
  const {
    activeAIRefineQuestion,
    setActiveAIRefineQuestion,
    applyAIQuestionRefine,
    showToast
  } = useApp();

  const [refineGoal, setRefineGoal] = useState<'CLARITY' | 'DISTRACTORS' | 'EXPLANATION' | 'DIFFICULTY'>('CLARITY');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasRefined, setHasRefined] = useState(false);
  const [refinedContent, setRefinedContent] = useState('');
  const [refinedExplanation, setRefinedExplanation] = useState('');

  if (!activeAIRefineQuestion) return null;

  const handleStartRefine = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setHasRefined(true);

      if (refineGoal === 'CLARITY') {
        setRefinedContent(
          activeAIRefineQuestion.content +
            ' (Lưu ý: Giả sử kết nối mạng hoạt động trong điều kiện lý tưởng không xảy ra mất gói).'
        );
        setRefinedExplanation(
          'AI đã chuẩn hoá thuật ngữ theo chuẩn IETF RFC 5681: ' +
            activeAIRefineQuestion.explanation
        );
      } else if (refineGoal === 'DISTRACTORS') {
        setRefinedContent(activeAIRefineQuestion.content);
        setRefinedExplanation(
          'AI đã tối ưu hoá độ bẫy của 3 đáp án nhiễu B, C, D để đánh giá chuẩn xác năng lực học viên.'
        );
      } else {
        setRefinedContent(activeAIRefineQuestion.content);
        setRefinedExplanation(
          'AI đã bổ sung công thức tính toán và phân tích từng bước chứng minh: ' +
            activeAIRefineQuestion.explanation
        );
      }
      showToast('AI đã hoàn tất đề xuất cải thiện câu hỏi!', 'success');
    }, 1200);
  };

  const handleApply = () => {
    applyAIQuestionRefine(
      activeAIRefineQuestion.id,
      refinedContent || activeAIRefineQuestion.content,
      refinedExplanation || activeAIRefineQuestion.explanation
    );
    setActiveAIRefineQuestion(null);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-fb-blue/30">
        {/* Header */}
        <div className="p-4 border-b border-fb-divider flex items-center justify-between bg-fb-blue-soft">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-fb-blue text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-fb-blue">
                AI Hỗ Trợ Tinh Chỉnh Câu Hỏi (AI.01 – AI.03)
              </h3>
              <p className="text-xs text-fb-blue">
                Tự động kiểm định ngữ pháp, tối ưu đáp án nhiễu & chuẩn hoá giải thích
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveAIRefineQuestion(null)}
            className="p-1.5 rounded-full hover:bg-fb-btn-hover text-fb-text-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Goal Selector */}
          <div>
            <label className="block text-xs font-bold text-fb-text mb-2">
              Chọn mục tiêu tinh chỉnh của AI:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'CLARITY', label: 'Diễn đạt rõ ràng', desc: 'Chuẩn hoá ngữ cảnh' },
                { id: 'DISTRACTORS', label: 'Đáp án nhiễu tốt hơn', desc: 'Tránh đoán mò' },
                { id: 'EXPLANATION', label: 'Chi tiết hoá lời giải', desc: 'Bổ sung dẫn chứng' },
                { id: 'DIFFICULTY', label: 'Tăng phân loại', desc: 'Đánh giá chuyên sâu' }
              ].map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setRefineGoal(goal.id as any)}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    refineGoal === goal.id
                      ? 'border-fb-blue bg-fb-blue-soft text-fb-blue ring-1 ring-fb-blue'
                      : 'border-fb-divider hover:bg-fb-hover'
                  }`}
                >
                  <span className="font-bold block">{goal.label}</span>
                  <span className="text-xs text-fb-text-3">{goal.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trigger button */}
          {!hasRefined && (
            <div className="text-center py-6">
              <button
                onClick={handleStartRefine}
                disabled={isProcessing}
                className="px-6 py-3 bg-fb-blue hover:bg-fb-blue-hover text-white font-bold text-xs rounded-lg shadow-md transition flex items-center gap-2 mx-auto disabled:opacity-60"
              >
                <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'AI đang phân tích câu hỏi...' : 'Bắt đầu nhờ AI tối ưu'}</span>
              </button>
            </div>
          )}

          {/* 2 CỘT DIFF SO SÁNH (AI.03) */}
          {hasRefined && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-fb-text-2">
                <span>So sánh thay đổi (Diff trực quan):</span>
                <span className="text-fb-success flex items-center gap-1">
                  <CheckCheck className="w-4 h-4" /> Đã tạo bản sửa đổi
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Bản gốc */}
                <div className="p-3.5 bg-fb-input rounded-lg border border-fb-divider">
                  <span className="font-bold text-fb-text-2 block mb-1">Bản gốc từ sinh viên</span>
                  <p className="text-fb-text mb-2">
                    {activeAIRefineQuestion.content}
                  </p>
                  <div className="pt-2 border-t border-fb-divider text-xs text-fb-text-2">
                    <strong>Giải thích:</strong> {activeAIRefineQuestion.explanation}
                  </div>
                </div>

                {/* Bản đề xuất AI */}
                <div className="p-3.5 bg-fb-blue-soft/70 rounded-lg border border-fb-blue/30">
                  <span className="font-bold text-fb-blue block mb-1">
                    BẢN ĐỀ XUẤT TỪ AI (ĐÃ TINH CHỈNH)
                  </span>
                  <p className="text-fb-blue font-medium mb-2">
                    {refinedContent}
                  </p>
                  <div className="pt-2 border-t border-fb-blue/30 text-xs text-fb-blue">
                    <strong>Giải thích tối ưu:</strong> {refinedExplanation}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-fb-divider bg-fb-input flex items-center justify-between">
          <button
            onClick={() => setActiveAIRefineQuestion(null)}
            className="px-4 py-2 border border-fb-divider rounded-lg text-xs font-semibold hover:bg-fb-hover transition"
          >
            Đóng
          </button>

          {hasRefined && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartRefine}
                className="px-3 py-2 border border-fb-blue/30 text-fb-blue rounded-lg text-xs font-semibold hover:bg-fb-blue-soft transition flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Thử mục tiêu khác
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Áp dụng bản sửa đổi của AI</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
