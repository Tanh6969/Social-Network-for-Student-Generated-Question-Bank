import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trophy,
  Users,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  Maximize2,
  Minimize2,
  Send,
  HelpCircle,
  Flame,
} from 'lucide-react';
import { TeacherGameRoom, QuestionAnalytics } from '../../types/teacherGameTypes';
import { getQuestionAnalyticsForGame, getParticipantsForGame } from '../../mockTeacherGames';
import { useApp } from '../../../demo/context/AppContext';

interface LiveGameHostModalProps {
  room: TeacherGameRoom;
  isOpen: boolean;
  onClose: () => void;
  onFinishGame: (roomId: string) => void;
}

export const LiveGameHostModal: React.FC<LiveGameHostModalProps> = ({
  room,
  isOpen,
  onClose,
  onFinishGame,
}) => {
  const { showToast } = useApp();

  const [questionsList, setQuestionsList] = useState<QuestionAnalytics[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(room.timePerQuestionSec || 25);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isRoomLocked, setIsRoomLocked] = useState(room.isRoomLocked);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Participants & live answers count
  const [liveAnswerCount, setLiveAnswerCount] = useState(62);
  const totalStudents = room.totalParticipants || 78;

  useEffect(() => {
    const list = getQuestionAnalyticsForGame(room.id);
    setQuestionsList(list);
    setCurrentQIndex(0);
    setSecondsLeft(room.timePerQuestionSec || 25);
    setShowAnswer(false);
    setShowLeaderboard(false);
  }, [room.id, room.timePerQuestionSec]);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || !isTimerRunning || showAnswer || showLeaderboard) return;

    if (secondsLeft <= 0) {
      setShowAnswer(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setShowAnswer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isTimerRunning, secondsLeft, showAnswer, showLeaderboard]);

  if (!isOpen) return null;

  const currentQ = questionsList[currentQIndex] || questionsList[0];
  const participants = getParticipantsForGame(room.id);
  const topFive = participants.slice(0, 5);

  const handleNextQuestion = () => {
    if (currentQIndex < questionsList.length - 1) {
      setCurrentQIndex((idx) => idx + 1);
      setSecondsLeft(room.timePerQuestionSec || 25);
      setShowAnswer(false);
      setShowLeaderboard(false);
      setIsTimerRunning(true);
      setLiveAnswerCount(Math.floor(totalStudents * (0.8 + Math.random() * 0.15)));
    } else {
      showToast('Đã hoàn thành toàn bộ câu hỏi trong phòng đấu!', 'success');
      setShowLeaderboard(true);
    }
  };

  const handleAddMoreTime = () => {
    setSecondsLeft((prev) => prev + 15);
    setIsTimerRunning(true);
    showToast('Đã cộng thêm +15 giây cho sinh viên!', 'info');
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (broadcastMsg.trim()) {
      showToast(`Đã phát thanh thông báo tới ${totalStudents} sinh viên: "${broadcastMsg.trim()}"`, 'success');
      setBroadcastMsg('');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[230] flex flex-col bg-slate-950 text-white select-none animate-in fade-in duration-200">
      {/* ================= TOP HOST BAR ================= */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-fb-blue/20 text-fb-blue px-3 py-1.5 rounded-lg border border-fb-blue/30">
            <Radio className="w-4 h-4 text-fb-blue animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Host Arena Live</span>
          </div>

          <div className="hidden md:block">
            <h1 className="text-sm font-bold text-slate-100 truncate max-w-md">
              {room.title}
            </h1>
            <p className="text-[11px] text-slate-400">
              {room.subjectCode} · Lớp tín chỉ:{' '}
              {room.targetClassCodes.includes('ALL') ? 'Toàn trường' : room.targetClassCodes.join(', ')}
            </p>
          </div>
        </div>

        {/* PIN Code Highlight for Students */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-slate-800 border border-slate-700 px-3 sm:px-4 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Mã PIN:</span>
            <span className="text-base sm:text-xl font-mono font-black text-yellow-400 tracking-widest tabular-nums">
              {room.joinPin}
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(room.joinPin);
                showToast('Đã sao chép mã PIN vào bộ nhớ tạm!', 'success');
              }}
              className="text-xs text-slate-400 hover:text-white ml-1 px-1.5 py-0.5 rounded-md hover:bg-slate-700"
              title="Sao chép PIN"
            >
              Copy
            </button>
          </div>

          {/* Connected Students Counter */}
          <div className="flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <Users className="w-4 h-4" />
            <span className="tabular-nums font-mono font-bold">{totalStudents}</span>
            <span className="hidden sm:inline">SV online</span>
          </div>

          {/* Close / Minimize */}
          <button
            onClick={onClose}
            aria-label="Đóng bảng điều hành"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ================= MAIN ARENA PROJECTION VIEW ================= */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
        {!showLeaderboard ? (
          <div className="w-full space-y-6">
            {/* Question Header & Countdown */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl w-full">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-fb-blue text-white flex items-center justify-center font-bold text-sm">
                  {currentQIndex + 1}/{questionsList.length || room.totalQuestions}
                </span>
                <div>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentQ?.chapter || 'Kiến thức cốt lõi'}
                  </span>
                  <p className="text-xs font-semibold text-slate-300">
                    Độ khó: <span className="text-yellow-400 font-bold">{currentQ?.difficulty || 'MEDIUM'}</span>
                  </p>
                </div>
              </div>

              {/* Big Circular/Badge Timer */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-2xl transition shadow-lg ${
                    secondsLeft <= 5
                      ? 'bg-rose-600 text-white animate-pulse'
                      : secondsLeft <= 10
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-yellow-400 border border-slate-700'
                  }`}
                >
                  <span className="tabular-nums">{secondsLeft}</span>
                  <span className="text-[9px] font-sans font-medium uppercase tracking-tighter -mt-1 text-slate-300">giây</span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Đã trả lời:</span>
                  <span className="text-sm font-bold text-emerald-400 tabular-nums">
                    {liveAnswerCount} / {totalStudents} SV
                  </span>
                </div>
              </div>
            </div>

            {/* Question Text Box (Projector Ready) */}
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl text-center shadow-2xl">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-relaxed">
                {currentQ?.questionText || 'Đang tải nội dung câu hỏi...'}
              </h2>
            </div>

            {/* 4 Options Grid (Kahoot style colors for easy viewing) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(currentQ?.options || []).map((opt) => {
                const isCorrect = opt.id === currentQ.correctAnswer;
                const colors = {
                  A: 'from-red-600 to-red-700 border-red-500',
                  B: 'from-blue-600 to-blue-700 border-blue-500',
                  C: 'from-amber-600 to-amber-700 border-amber-500',
                  D: 'from-emerald-600 to-emerald-700 border-emerald-500',
                }[opt.id];

                return (
                  <div
                    key={opt.id}
                    className={`relative p-4 rounded-xl border bg-gradient-to-r ${colors} text-white shadow-md transition-all flex items-center gap-3 overflow-hidden ${
                      showAnswer && !isCorrect ? 'opacity-40 grayscale-40' : 'opacity-100'
                    } ${showAnswer && isCorrect ? 'ring-4 ring-yellow-400 scale-[1.01]' : ''}`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center font-black text-sm shrink-0">
                      {opt.id}
                    </span>
                    <span className="text-sm sm:text-base font-semibold flex-1 leading-snug">
                      {opt.text}
                    </span>

                    {/* Reveal stats bar */}
                    {showAnswer && (
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold block tabular-nums">
                          {opt.pickPercent}%
                        </span>
                        <span className="text-[10px] text-white/80 block">
                          ({opt.pickCount} SV)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pedagogical Note when Revealed */}
            {showAnswer && currentQ?.commonMistakePedagogicalNote && (
              <div className="p-4 bg-slate-900/90 border border-amber-500/30 rounded-xl text-left animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Lời Khuyên Sư Phạm Cho Giảng Viên</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentQ.commonMistakePedagogicalNote}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ================= LIVE TOP 5 LEADERBOARD ================= */
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-xs font-bold">
              <Trophy className="w-4 h-4" />
              <span>Bảng Xếp Hạng Đấu Trường Trực Tiếp</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white">
              Top 5 Thủ Khoa Vòng Đấu
            </h3>

            <div className="space-y-2.5">
              {topFive.map((student, idx) => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                    idx === 0
                      ? 'bg-yellow-500/10 border-yellow-500/50 shadow-lg'
                      : idx === 1
                      ? 'bg-slate-800/80 border-slate-600'
                      : idx === 2
                      ? 'bg-amber-900/20 border-amber-700/50'
                      : 'bg-slate-800/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-yellow-400 text-slate-950 font-black'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950 font-bold'
                          : idx === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white flex items-center gap-1.5">
                        {student.fullName}
                        {student.maxStreak >= 3 && (
                          <span className="text-[10px] text-amber-400 flex items-center">
                            <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {student.maxStreak}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        MSSV: {student.studentCode} · Lớp: {student.courseClassCode}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-yellow-400 tabular-nums">
                      {student.score.toLocaleString()} pts
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-semibold">
                      +{student.pointsAwarded} đ thưởng
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowLeaderboard(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Quay lại câu hỏi
              </button>
              <button
                onClick={() => {
                  onFinishGame(room.id);
                  onClose();
                }}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Chốt Trận Đấu & Trao Điểm Thưởng</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ================= BOTTOM MC & HOST CONTROLLER BAR ================= */}
      <footer className="h-20 px-4 sm:px-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4 shrink-0">
        {/* Left: Quick Announcement to students */}
        <form onSubmit={handleSendBroadcast} className="hidden lg:flex items-center gap-2 max-w-sm w-full">
          <input
            type="text"
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder="Gửi thông báo nhanh xuống máy sinh viên..."
            className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:border-fb-blue"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Center: Live Action Controller */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-1">
          {/* Timer Pause / Resume */}
          <button
            onClick={() => setIsTimerRunning((r) => !r)}
            className="px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
          >
            {isTimerRunning ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{isTimerRunning ? 'Tạm dừng' : 'Tiếp tục'}</span>
          </button>

          {/* +15s More Time */}
          <button
            onClick={handleAddMoreTime}
            className="px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
            title="Thêm 15 giây cho sinh viên"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+15s</span>
          </button>

          {/* Show / Hide Answer */}
          <button
            onClick={() => setShowAnswer((a) => !a)}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
              showAnswer
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án'}</span>
          </button>

          {/* Toggle Live Leaderboard */}
          <button
            onClick={() => setShowLeaderboard((l) => !l)}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
              showLeaderboard
                ? 'bg-fb-blue text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="hidden sm:inline">Bảng xếp hạng</span>
          </button>

          {/* Next Question */}
          <button
            onClick={handleNextQuestion}
            className="px-5 sm:px-6 py-2 rounded-xl bg-fb-blue hover:bg-fb-blue-hover text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md"
          >
            <span>Câu kế tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Room Security & Sound Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsRoomLocked((l) => !l);
              showToast(isRoomLocked ? 'Đã mở khóa phòng đấu' : 'Đã khóa phòng, chặn người vào muộn', 'info');
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition border ${
              isRoomLocked
                ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={isRoomLocked ? 'Phòng đang khóa' : 'Phòng đang mở'}
          >
            {isRoomLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            title={soundEnabled ? 'Tắt âm thanh MC' : 'Bật âm thanh MC'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </footer>
    </div>,
    document.body,
  );
};
