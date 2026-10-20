import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Compass,
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
  CheckSquare,
  Gamepad2,
  Sparkles
} from 'lucide-react';

export const TourGuideModal: React.FC = () => {
  const { isTourGuideOpen, setIsTourGuideOpen, switchRole, setActiveTab } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isTourGuideOpen) return null;

  const steps = [
    {
      title: 'Chào mừng bạn đến với UniSocial & ExamBank!',
      desc: 'Nền tảng mạng xã hội học tập kết hợp ngân hàng đề thi đại học chuẩn quốc gia, thiết kế theo phong cách Facebook Web kinh điển (3 cột, 2 cột và chat dock realtime).',
      icon: Compass,
      color: 'text-blue-600 bg-blue-100',
      actionText: 'Bắt đầu tìm hiểu'
    },
    {
      title: 'Đề xuất & Ôn tập Ngân hàng đề thi',
      desc: 'Sinh viên có thể trực tiếp biên soạn các câu hỏi trắc nghiệm A, B, C, D kèm lời giải thích, kiểm tra làm thử tự động với hiệu ứng âm thanh và chấm điểm cống hiến.',
      icon: BookOpen,
      color: 'text-indigo-600 bg-indigo-100',
      actionText: 'Tiếp tục'
    },
    {
      title: 'Quy trình Giảng viên kiểm duyệt & AI',
      desc: 'Hội đồng Giảng viên có khu vực kiểm duyệt 3 panel độc quyền: rà soát trùng lặp, dùng AI tối ưu hoá đáp án nhiễu, phê chuẩn vào ngân hàng trường và sinh đề thi tự động.',
      icon: CheckSquare,
      color: 'text-purple-600 bg-purple-100',
      actionText: 'Khám phá tiếp'
    },
    {
      title: 'Minigame Dự đoán & Kho Cosmetics',
      desc: 'Tham gia dự đoán số lượng SV tham gia hoặc quy mô ngân hàng trước Chủ Nhật để tích điểm, lọt top Bảng vàng và mở khóa các khung avatar hào quang hoàng gia!',
      icon: Sparkles,
      color: 'text-amber-600 bg-amber-100',
      actionText: 'Hoàn thành'
    }
  ];

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsTourGuideOpen(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#242526] rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-700 space-y-5 text-center animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Hướng dẫn sử dụng · Bước {currentStep + 1}/{steps.length}
          </span>
          <button
            onClick={() => setIsTourGuideOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${step.color} shadow-sm`}>
          <step.icon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
            {step.title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed px-4">
            {step.desc}
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pt-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep ? 'w-6 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-3 py-1.5 text-xs text-gray-400 disabled:opacity-0 font-semibold"
          >
            Quay lại
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <span>{step.actionText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
