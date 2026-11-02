import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  X,
  FileCode,
  Sliders,
  CheckCircle2,
  Download,
  Copy,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export const ExamGeneratorWizard: React.FC = () => {
  const { isExamWizardOpen, setIsExamWizardOpen, generateExam, questions, showToast } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [examTitle, setExamTitle] = useState('Đề thi Kết thúc học phần Mạng máy tính - Kỳ 2026.1');
  const [subject, setSubject] = useState('Mạng máy tính');
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [numExamCodes, setNumExamCodes] = useState(4);

  // Difficulty sliders
  const [easyPercent, setEasyPercent] = useState(40);
  const [mediumPercent, setMediumPercent] = useState(40);
  const [hardPercent, setHardPercent] = useState(20);

  const [generatedExamResult, setGeneratedExamResult] = useState<any>(null);

  if (!isExamWizardOpen) return null;

  const handleGenerate = () => {
    const easyCount = Math.round((totalQuestions * easyPercent) / 100);
    const mediumCount = Math.round((totalQuestions * mediumPercent) / 100);
    const hardCount = totalQuestions - easyCount - mediumCount;

    const codes = Array.from({ length: numExamCodes }, (_, i) => `Mã đề ${101 + i}`);

    const result = generateExam({
      title: examTitle,
      subject,
      examCodes: codes,
      totalQuestions,
      durationMinutes,
      difficultyMatrix: {
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount
      },
      questions: questions.filter((q) => q.status === 'APPROVED').slice(0, totalQuestions)
    });

    setGeneratedExamResult(result);
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-fb-divider">
        {/* Header */}
        <div className="p-4 border-b border-fb-divider flex items-center justify-between bg-fb-input">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-fb-blue-soft text-fb-blue flex items-center justify-center font-bold">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-fb-text">
                Bộ Sinh Đề Thi Tự Động (EXAM.01 – EXAM.04)
              </h3>
              <p className="text-xs text-fb-text-2">
                Wizard 3 bước: Cấu hình ma trận độ khó → Bốc ngẫu nhiên câu hỏi → Xuất mã đề kèm đáp án
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExamWizardOpen(false)}
            className="p-1.5 rounded-full hover:bg-fb-btn-hover text-fb-text-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper indicator */}
        <div className="flex border-b border-fb-divider px-6 py-3 bg-fb-card text-xs font-bold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-fb-blue' : 'text-fb-text-3'}`}>
            <span className="w-5 h-5 rounded-full bg-fb-blue-soft flex items-center justify-center">1</span>
            <span>Thông tin đề thi</span>
          </div>
          <ArrowRight className="w-4 h-4 text-fb-text-3 mx-4" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-fb-blue' : 'text-fb-text-3'}`}>
            <span className="w-5 h-5 rounded-full bg-fb-blue-soft flex items-center justify-center">2</span>
            <span>Ma trận & Tỉ lệ độ khó</span>
          </div>
          <ArrowRight className="w-4 h-4 text-fb-text-3 mx-4" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-fb-success' : 'text-fb-text-3'}`}>
            <span className="w-5 h-5 rounded-full bg-fb-success-soft flex items-center justify-center">3</span>
            <span>Xem trước & Xuất file</span>
          </div>
        </div>

        {/* Step contents */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {step === 1 && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-bold text-fb-text mb-1">
                  Tên đề thi chính thức:
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full p-2.5 text-xs border border-fb-divider rounded-lg bg-fb-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fb-text mb-1">
                    Môn học:
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 text-xs border border-fb-divider rounded-lg bg-fb-input"
                  >
                    <option value="Mạng máy tính">Mạng máy tính</option>
                    <option value="Cấu trúc dữ liệu & Giải thuật">Cấu trúc dữ liệu & Giải thuật</option>
                    <option value="Cơ sở dữ liệu">Cơ sở dữ liệu</option>
                    <option value="Giải tích 1">Giải tích 1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-fb-text mb-1">
                    Thời gian làm bài:
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-fb-divider rounded-lg bg-fb-input"
                  >
                    <option value={45}>45 phút</option>
                    <option value={60}>60 phút</option>
                    <option value={90}>90 phút</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fb-text mb-1">
                    Tổng số câu hỏi:
                  </label>
                  <input
                    type="number"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-fb-divider rounded-lg bg-fb-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-fb-text mb-1">
                    Số mã đề cần trộn (xáo câu & đáp án):
                  </label>
                  <input
                    type="number"
                    value={numExamCodes}
                    onChange={(e) => setNumExamCodes(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-fb-divider rounded-lg bg-fb-input"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 max-w-xl mx-auto">
              <h4 className="font-bold text-xs text-fb-text-2">
                Cấu hình tỉ lệ ma trận độ khó (%):
              </h4>

              <div className="p-4 bg-fb-success-soft rounded-lg space-y-2">
                <div className="flex justify-between text-xs font-bold text-fb-success">
                  <span>Dễ (Nhận biết / Thông hiểu)</span>
                  <span>{easyPercent}% ({Math.round((totalQuestions * easyPercent) / 100)} câu)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={easyPercent}
                  onChange={(e) => setEasyPercent(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div className="p-4 bg-fb-warning-soft rounded-lg space-y-2">
                <div className="flex justify-between text-xs font-bold text-fb-warning">
                  <span>Trung bình (Vận dụng)</span>
                  <span>{mediumPercent}% ({Math.round((totalQuestions * mediumPercent) / 100)} câu)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mediumPercent}
                  onChange={(e) => setMediumPercent(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              <div className="p-4 bg-fb-danger-soft rounded-lg space-y-2">
                <div className="flex justify-between text-xs font-bold text-fb-danger">
                  <span>Khó (Vận dụng cao)</span>
                  <span>{hardPercent}% ({Math.round((totalQuestions * hardPercent) / 100)} câu)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hardPercent}
                  onChange={(e) => setHardPercent(Number(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>
            </div>
          )}

          {step === 3 && generatedExamResult && (
            <div className="space-y-4">
              <div className="p-4 bg-fb-success-soft border border-fb-success/30 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-fb-success">
                    Đã sinh thành công {generatedExamResult.examCodes.length} mã đề thi!
                  </h4>
                  <p className="text-xs text-fb-success">
                    Các mã đề: {generatedExamResult.examCodes.join(', ')} · Tổng {generatedExamResult.totalQuestions} câu hỏi
                  </p>
                </div>
                <button
                  onClick={() => showToast('Đã tải xuống file đề thi và đáp án PDF!', 'success')}
                  className="px-4 py-2 bg-fb-success hover:bg-fb-success/90 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file đề (PDF)</span>
                </button>
              </div>

              <div className="border border-fb-divider rounded-lg p-4 bg-fb-input text-xs space-y-2">
                <p className="font-bold text-fb-text">
                  {generatedExamResult.title} - Thời gian: {generatedExamResult.durationMinutes} phút
                </p>
                <div className="grid grid-cols-3 divide-x divide-fb-divider text-center pt-2">
                  <div className="p-2">
                    <span className="text-fb-text-2 block">Dễ</span>
                    <span className="font-bold text-fb-success">{generatedExamResult.difficultyMatrix.easy} câu</span>
                  </div>
                  <div className="p-2">
                    <span className="text-fb-text-2 block">Trung bình</span>
                    <span className="font-bold text-fb-warning">{generatedExamResult.difficultyMatrix.medium} câu</span>
                  </div>
                  <div className="p-2">
                    <span className="text-fb-text-2 block">Khó</span>
                    <span className="font-bold text-fb-danger">{generatedExamResult.difficultyMatrix.hard} câu</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-fb-divider bg-fb-input flex items-center justify-between">
          {step > 1 && step < 3 && (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 border rounded-lg text-xs font-semibold"
            >
              Quay lại
            </button>
          )}

          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              className="ml-auto px-6 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold"
            >
              Tiếp tục: Cấu hình ma trận
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleGenerate}
              className="ml-auto px-6 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold shadow-md"
            >
              Bắt đầu sinh đề & trộn mã
            </button>
          )}

          {step === 3 && (
            <button
              onClick={() => setIsExamWizardOpen(false)}
              className="ml-auto px-6 py-2 bg-fb-blue text-white rounded-lg text-xs font-bold"
            >
              Hoàn thành
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
