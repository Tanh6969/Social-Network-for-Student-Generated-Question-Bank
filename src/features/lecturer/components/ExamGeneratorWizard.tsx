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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-[#1E1F20]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                Bộ Sinh Đề Thi Tự Động (EXAM.01 – EXAM.04)
              </h3>
              <p className="text-xs text-gray-500">
                Wizard 3 bước: Cấu hình ma trận độ khó → Bốc ngẫu nhiên câu hỏi → Xuất mã đề kèm đáp án
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExamWizardOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper indicator */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 py-3 bg-white dark:bg-[#242526] text-xs font-bold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">1</span>
            <span>Thông tin đề thi</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 mx-4" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">2</span>
            <span>Ma trận & Tỉ lệ độ khó</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 mx-4" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">3</span>
            <span>Xem trước & Xuất file</span>
          </div>
        </div>

        {/* Step contents */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {step === 1 && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Tên đề thi chính thức:
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Môn học:
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C]"
                  >
                    <option value="Mạng máy tính">Mạng máy tính</option>
                    <option value="Cấu trúc dữ liệu & Giải thuật">Cấu trúc dữ liệu & Giải thuật</option>
                    <option value="Cơ sở dữ liệu">Cơ sở dữ liệu</option>
                    <option value="Giải tích 1">Giải tích 1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Thời gian làm bài:
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C]"
                  >
                    <option value={45}>45 phút</option>
                    <option value={60}>60 phút</option>
                    <option value={90}>90 phút</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Tổng số câu hỏi:
                  </label>
                  <input
                    type="number"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Số mã đề cần trộn (xáo câu & đáp án):
                  </label>
                  <input
                    type="number"
                    value={numExamCodes}
                    onChange={(e) => setNumExamCodes(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 max-w-xl mx-auto">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">
                Cấu hình tỉ lệ ma trận độ khó (%):
              </h4>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
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

              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
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

              <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-bold text-red-800 dark:text-red-300">
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
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                    Đã sinh thành công {generatedExamResult.examCodes.length} mã đề thi!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Các mã đề: {generatedExamResult.examCodes.join(', ')} · Tổng {generatedExamResult.totalQuestions} câu hỏi
                  </p>
                </div>
                <button
                  onClick={() => showToast('Đã tải xuống file đề thi và đáp án PDF!', 'success')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file đề (PDF)</span>
                </button>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-[#1E1F20] text-xs space-y-2">
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {generatedExamResult.title} - Thời gian: {generatedExamResult.durationMinutes} phút
                </p>
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-white dark:bg-[#242526] p-2 rounded-lg border">
                    <span className="text-gray-500 block">Dễ</span>
                    <span className="font-bold text-emerald-600">{generatedExamResult.difficultyMatrix.easy} câu</span>
                  </div>
                  <div className="bg-white dark:bg-[#242526] p-2 rounded-lg border">
                    <span className="text-gray-500 block">Trung bình</span>
                    <span className="font-bold text-amber-600">{generatedExamResult.difficultyMatrix.medium} câu</span>
                  </div>
                  <div className="bg-white dark:bg-[#242526] p-2 rounded-lg border">
                    <span className="text-gray-500 block">Khó</span>
                    <span className="font-bold text-red-600">{generatedExamResult.difficultyMatrix.hard} câu</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1F20] flex items-center justify-between">
          {step > 1 && step < 3 && (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold"
            >
              Quay lại
            </button>
          )}

          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              className="ml-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
            >
              Tiếp tục: Cấu hình ma trận
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleGenerate}
              className="ml-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md"
            >
              Bắt đầu sinh đề & trộn mã
            </button>
          )}

          {step === 3 && (
            <button
              onClick={() => setIsExamWizardOpen(false)}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Hoàn thành
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
