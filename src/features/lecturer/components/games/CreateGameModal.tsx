import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Gamepad2,
  Users,
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  Layers,
  ChevronRight,
  ChevronLeft,
  Flame,
  HelpCircle,
  Hash,
} from 'lucide-react';
import { TeacherGameRoom, GameMode } from '../../types/teacherGameTypes';
import { MOCK_SUBJECTS, MOCK_COURSE_CLASSES } from '../../mockExamData';
import { useApp } from '../../../demo/context/AppContext';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameCreated: (newGame: TeacherGameRoom) => void;
}

export const CreateGameModal: React.FC<CreateGameModalProps> = ({
  isOpen,
  onClose,
  onGameCreated,
}) => {
  const { questions, showToast, currentUser } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(1);
  const [selectedClassCodes, setSelectedClassCodes] = useState<string[]>(['171146']);
  const [gameMode, setGameMode] = useState<GameMode>('LIVE_ARENA');
  const [timePerQuestion, setTimePerQuestion] = useState<number>(30);
  const [scoringRule, setScoringRule] = useState<'SPEED_ACCURACY' | 'STANDARD' | 'STREAK_BONUS'>('SPEED_ACCURACY');
  const [rewardPoints, setRewardPoints] = useState<number>(300);
  const [rewardBadge, setRewardBadge] = useState<string>('Chiến thần Bài Tập');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficultyMix, setDifficultyMix] = useState<{ easy: number; medium: number; hard: number }>({
    easy: 4,
    medium: 4,
    hard: 2,
  });

  if (!isOpen) return null;

  const currentSubject = MOCK_SUBJECTS.find((s) => s.subject_id === selectedSubjectId) ?? MOCK_SUBJECTS[0];
  const availableClassesForSubject = MOCK_COURSE_CLASSES.filter(
    (c) => c.subject_id === selectedSubjectId,
  );

  const toggleClassCode = (code: string) => {
    if (code === 'ALL') {
      setSelectedClassCodes(['ALL']);
      return;
    }
    const filtered = selectedClassCodes.filter((c) => c !== 'ALL');
    if (filtered.includes(code)) {
      const next = filtered.filter((c) => c !== code);
      setSelectedClassCodes(next.length === 0 ? ['ALL'] : next);
    } else {
      setSelectedClassCodes([...filtered, code]);
    }
  };

  const handleCreateSubmit = () => {
    if (!title.trim()) {
      showToast('Vui lòng nhập tên trò chơi hoặc phòng đấu!', 'error');
      return;
    }

    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const newRoom: TeacherGameRoom = {
      id: `game_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || `Phòng thi đấu kiến thức môn ${currentSubject.name ?? 'Chung'} dành cho sinh viên.`,
      subjectId: currentSubject.subject_id ?? 1,
      subjectName: currentSubject.name ?? 'Môn học',
      subjectCode: currentSubject.code ?? 'IT3000',
      targetClassCodes: selectedClassCodes.length ? selectedClassCodes : ['ALL'],
      gameMode,
      status: gameMode === 'LIVE_ARENA' ? 'RUNNING' : 'SCHEDULED',
      joinPin: pin,
      totalQuestions: questionCount,
      timePerQuestionSec: timePerQuestion,
      scoringRule,
      rewardPoints,
      rewardBadgeTitle: rewardBadge,
      createdAt: new Date().toISOString(),
      startedAt: gameMode === 'LIVE_ARENA' ? new Date().toISOString() : undefined,
      scheduledAt: gameMode !== 'LIVE_ARENA' ? new Date(Date.now() + 86400000).toISOString() : undefined,
      hostName: currentUser.name || 'TS. Trần Minh Đức',
      totalParticipants: 0,
      averageGrade: 0,
      averageAccuracyPercent: 0,
      isRoomLocked: false,
      questionIds: questions.slice(0, questionCount).map((q) => q.id),
    };

    onGameCreated(newRoom);
    showToast(`Đã tạo thành công phòng "${newRoom.title}"! Mã PIN: ${pin}`, 'success');
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Thiết lập phòng đấu học tập"
        className="bg-fb-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-fb-divider animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-fb-divider flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-fb-blue-soft text-fb-blue flex items-center justify-center font-bold">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-fb-text">
                Thiết Lập Trò Chơi & Đấu Trường Mới
              </h2>
              <p className="text-xs text-fb-text-2">
                Dành cho Giảng viên vận hành lớp học phần đa môn & hàng trăm sinh viên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-fb-hover flex items-center justify-center text-fb-text-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Wizard Indicator */}
        <div className="grid grid-cols-3 border-b border-fb-divider text-xs font-semibold bg-fb-input/40 select-none">
          <button
            onClick={() => setStep(1)}
            className={`py-3 px-4 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              step === 1
                ? 'border-fb-blue text-fb-blue bg-fb-card font-bold'
                : 'border-transparent text-fb-text-2 hover:text-fb-text'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-fb-blue text-white text-[11px] flex items-center justify-center">1</span>
            <span>Môn & Lớp học phần</span>
          </button>
          <button
            onClick={() => setStep(2)}
            className={`py-3 px-4 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              step === 2
                ? 'border-fb-blue text-fb-blue bg-fb-card font-bold'
                : 'border-transparent text-fb-text-2 hover:text-fb-text'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-fb-blue text-white text-[11px] flex items-center justify-center">2</span>
            <span>Hình thức & Quy tắc</span>
          </button>
          <button
            onClick={() => setStep(3)}
            className={`py-3 px-4 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              step === 3
                ? 'border-fb-blue text-fb-blue bg-fb-card font-bold'
                : 'border-transparent text-fb-text-2 hover:text-fb-text'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-fb-blue text-white text-[11px] flex items-center justify-center">3</span>
            <span>Câu hỏi & Thưởng</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-fb-text block mb-1.5">
                  Tên trò chơi / Phòng đấu <span className="text-fb-danger">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đấu trường Live: Giải mã Deadlock & Định thời CPU K68"
                  className="w-full px-3 py-2 rounded-lg bg-fb-input border border-fb-divider text-sm text-fb-text placeholder:text-fb-text-3 outline-none focus:ring-2 focus:ring-fb-blue/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-fb-text block mb-1.5">
                  Mô tả mục tiêu sư phạm
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhắc nhở ôn tập, trọng tâm kiến thức và thông điệp gửi tới sinh viên..."
                  className="w-full px-3 py-2 rounded-lg bg-fb-input border border-fb-divider text-xs text-fb-text placeholder:text-fb-text-3 outline-none focus:ring-2 focus:ring-fb-blue/50"
                />
              </div>

              {/* Subject Select */}
              <div>
                <label className="text-xs font-bold text-fb-text block mb-1.5">
                  Môn học áp dụng
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    const sid = Number(e.target.value);
                    setSelectedSubjectId(sid);
                    const classes = MOCK_COURSE_CLASSES.filter((c) => c.subject_id === sid);
                    const firstCode = classes.length > 0 && classes[0].class_code ? classes[0].class_code : 'ALL';
                    setSelectedClassCodes([firstCode]);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-fb-input border border-fb-divider text-sm text-fb-text outline-none focus:ring-2 focus:ring-fb-blue/50"
                >
                  {MOCK_SUBJECTS.map((s) => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class filtering */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-fb-text">
                    Lớp tín chỉ tham gia (Giải quyết bài toán SV học chéo môn)
                  </label>
                  <span className="text-[11px] text-fb-text-2">
                    Có thể chọn 1 hoặc nhiều lớp cùng thi đấu
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleClassCode('ALL')}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition text-left flex items-center justify-between ${
                      selectedClassCodes.includes('ALL')
                        ? 'border-fb-blue bg-fb-blue-soft text-fb-blue font-bold'
                        : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
                    }`}
                  >
                    <span>Toàn bộ các lớp</span>
                    {selectedClassCodes.includes('ALL') && <CheckCircle2 className="w-3.5 h-3.5 text-fb-blue" />}
                  </button>

                  {availableClassesForSubject
                    .filter((c): c is typeof c & { class_code: string } => Boolean(c.class_code))
                    .map((c) => {
                      const isSelected = selectedClassCodes.includes(c.class_code);
                      return (
                        <button
                          key={c.class_code}
                          type="button"
                          onClick={() => toggleClassCode(c.class_code)}
                          className={`px-3 py-2 rounded-lg border text-xs font-medium transition text-left flex items-center justify-between ${
                            isSelected
                              ? 'border-fb-blue bg-fb-blue-soft text-fb-blue font-bold'
                              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-fb-text">Lớp {c.class_code}</p>
                            <p className="text-[10px] text-fb-text-2">{c.total_students} sinh viên</p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-fb-blue" />}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-fb-text block mb-2">
                  Chọn Hình Thức Hoạt Động (Game Mode)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setGameMode('LIVE_ARENA')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      gameMode === 'LIVE_ARENA'
                        ? 'border-fb-blue bg-fb-blue-soft/50 ring-2 ring-fb-blue/20'
                        : 'border-fb-divider hover:bg-fb-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-fb-blue font-bold text-sm">
                      <Gamepad2 className="w-4 h-4" />
                      <span>Đấu trường Trực tiếp (Live Kahoot)</span>
                    </div>
                    <p className="text-xs text-fb-text-2 mt-1">
                      Giảng viên làm Host điều khiển từng câu hỏi trên máy chiếu, sinh viên trả lời trực tiếp qua điện thoại / laptop.
                    </p>
                  </div>

                  <div
                    onClick={() => setGameMode('WEEKLY_QUEST')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      gameMode === 'WEEKLY_QUEST'
                        ? 'border-fb-blue bg-fb-blue-soft/50 ring-2 ring-fb-blue/20'
                        : 'border-fb-divider hover:bg-fb-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-fb-success font-bold text-sm">
                      <BookOpen className="w-4 h-4" />
                      <span>Thử thách Tự luyện 7 Ngày</span>
                    </div>
                    <p className="text-xs text-fb-text-2 mt-1">
                      Sinh viên làm bài tập tự luyện tại nhà theo hạn chót, tính điểm chuyên cần và xếp hạng đua top.
                    </p>
                  </div>

                  <div
                    onClick={() => setGameMode('PREDICTION_CHALLENGE')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      gameMode === 'PREDICTION_CHALLENGE'
                        ? 'border-fb-blue bg-fb-blue-soft/50 ring-2 ring-fb-blue/20'
                        : 'border-fb-divider hover:bg-fb-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-fb-warning font-bold text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>Minigame Dự đoán Chỉ số</span>
                    </div>
                    <p className="text-xs text-fb-text-2 mt-1">
                      Dự đoán phổ điểm hoặc số câu hỏi duyệt thành công để kích thích sự gắn kết cộng đồng học tập.
                    </p>
                  </div>

                  <div
                    onClick={() => setGameMode('PEER_DUEL')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      gameMode === 'PEER_DUEL'
                        ? 'border-fb-blue bg-fb-blue-soft/50 ring-2 ring-fb-blue/20'
                        : 'border-fb-divider hover:bg-fb-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
                      <Flame className="w-4 h-4" />
                      <span>Đấu Cặp 1vs1 Xếp Hạng</span>
                    </div>
                    <p className="text-xs text-fb-text-2 mt-1">
                      Ghép cặp 2 sinh viên trong lớp thi đấu tốc độ giải đề trắc nghiệm ngẫu nhiên.
                    </p>
                  </div>
                </div>
              </div>

              {/* Time & Scoring */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-fb-text block mb-1">
                    Thời gian mỗi câu hỏi
                  </label>
                  <select
                    value={timePerQuestion}
                    onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-fb-input border border-fb-divider text-xs text-fb-text outline-none focus:ring-2 focus:ring-fb-blue/50"
                  >
                    <option value={15}>15 giây (Cực nhanh)</option>
                    <option value={20}>20 giây (Chuẩn Kahoot)</option>
                    <option value={30}>30 giây (Mặc định)</option>
                    <option value={45}>45 giây (Bài tập tính toán)</option>
                    <option value={60}>60 giây (Đề bài phức tạp)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-fb-text block mb-1">
                    Quy tắc tính điểm
                  </label>
                  <select
                    value={scoringRule}
                    onChange={(e) => setScoringRule(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-fb-input border border-fb-divider text-xs text-fb-text outline-none focus:ring-2 focus:ring-fb-blue/50"
                  >
                    <option value="SPEED_ACCURACY">Đúng + Tốc độ (Speed Bonus)</option>
                    <option value="STANDARD">Chỉ tính câu đúng (Chuẩn)</option>
                    <option value="STREAK_BONUS">Thưởng chuỗi đúng liên tiếp (Streak 🔥)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* Question source */}
              <div className="p-4 bg-fb-input rounded-xl border border-fb-divider space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-fb-text">
                    Nguồn câu hỏi từ Ngân hàng đề môn {currentSubject.name}
                  </span>
                  <span className="text-xs text-fb-blue font-semibold">
                    Đã chọn {questionCount} câu hỏi
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-fb-text-2 block mb-1">Dễ (Easy)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={difficultyMix.easy}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setDifficultyMix({ ...difficultyMix, easy: val });
                        setQuestionCount(val + difficultyMix.medium + difficultyMix.hard);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-fb-divider bg-fb-card text-xs font-bold text-fb-text"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-fb-text-2 block mb-1">Trung bình (Medium)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={difficultyMix.medium}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setDifficultyMix({ ...difficultyMix, medium: val });
                        setQuestionCount(difficultyMix.easy + val + difficultyMix.hard);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-fb-divider bg-fb-card text-xs font-bold text-fb-text"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-fb-text-2 block mb-1">Khó (Hard)</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={difficultyMix.hard}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setDifficultyMix({ ...difficultyMix, hard: val });
                        setQuestionCount(difficultyMix.easy + difficultyMix.medium + val);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-fb-divider bg-fb-card text-xs font-bold text-fb-text"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-fb-text-3">
                  ✓ Hệ thống tự động bốc ngẫu nhiên câu hỏi đạt chuẩn kiểm định của viện.
                </p>
              </div>

              {/* Rewards */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-fb-text block mb-1">
                    Điểm thưởng cống hiến (UniPoints)
                  </label>
                  <input
                    type="number"
                    step={50}
                    value={rewardPoints}
                    onChange={(e) => setRewardPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-fb-input border border-fb-divider text-xs font-bold text-fb-text outline-none focus:ring-2 focus:ring-fb-blue/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-fb-text block mb-1">
                    Tên huy hiệu vinh danh
                  </label>
                  <input
                    type="text"
                    value={rewardBadge}
                    onChange={(e) => setRewardBadge(e.target.value)}
                    placeholder="Ví dụ: Chiến thần Mạng Máy Tính"
                    className="w-full px-3 py-2 rounded-lg bg-fb-input border border-fb-divider text-xs text-fb-text outline-none focus:ring-2 focus:ring-fb-blue/50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-fb-divider bg-fb-card flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-lg border border-fb-divider text-xs font-semibold text-fb-text hover:bg-fb-hover transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-fb-divider text-xs font-semibold text-fb-text-2 hover:bg-fb-hover transition"
            >
              Hủy bỏ
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !title.trim()) {
                  showToast('Vui lòng nhập tên trò chơi trước khi tiếp tục!', 'warning');
                  return;
                }
                setStep((s) => (s + 1) as any);
              }}
              className="px-5 py-2 rounded-lg bg-fb-blue text-white text-xs font-semibold hover:bg-fb-blue-hover transition flex items-center gap-1 shadow-xs"
            >
              <span>Tiếp tục</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleCreateSubmit}
              className="px-6 py-2 rounded-lg bg-fb-blue text-white text-xs font-bold hover:bg-fb-blue-hover transition flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Khởi tạo & Cấp mã PIN</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
