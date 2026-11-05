import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileSpreadsheet,
  Award,
  Share2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
  Trophy,
  Flame,
  ArrowUpDown,
  ChevronDown,
  Sparkles,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { TeacherGameRoom, StudentParticipant } from '../../types/teacherGameTypes';
import {
  getParticipantsForGame,
  getQuestionAnalyticsForGame,
  getClassComparisonsForGame,
  exportGameRosterToCSV,
} from '../../mockTeacherGames';
import { useApp } from '../../../demo/context/AppContext';

interface GameResultsModalProps {
  room: TeacherGameRoom;
  isOpen: boolean;
  onClose: () => void;
}

export const GameResultsModal: React.FC<GameResultsModalProps> = ({
  room,
  isOpen,
  onClose,
}) => {
  const { showToast, createPost, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'ROSTER' | 'CLASSES' | 'ANALYTICS'>('ROSTER');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'rank' | 'score' | 'grade' | 'name'>('rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [awardedSuccess, setAwardedSuccess] = useState(false);

  const rawParticipants = useMemo(() => getParticipantsForGame(room.id), [room.id]);
  const classComparisons = useMemo(() => getClassComparisonsForGame(room), [room]);
  const questionAnalytics = useMemo(() => getQuestionAnalyticsForGame(room.id), [room.id]);

  // Multi-class filter & search
  const filteredParticipants = useMemo(() => {
    return rawParticipants.filter((p) => {
      const matchClass =
        selectedClassFilter === 'ALL' || p.courseClassCode === selectedClassFilter;
      const term = searchQuery.trim().toLowerCase();
      const matchSearch =
        !term ||
        p.fullName.toLowerCase().includes(term) ||
        p.studentCode.includes(term) ||
        p.homeClass.toLowerCase().includes(term);
      return matchClass && matchSearch;
    }).sort((a, b) => {
      let diff = 0;
      if (sortField === 'rank') diff = a.rank - b.rank;
      else if (sortField === 'score') diff = b.score - a.score;
      else if (sortField === 'grade') diff = b.gradeScale10 - a.gradeScale10;
      else if (sortField === 'name') diff = a.fullName.localeCompare(b.fullName);
      return sortAsc ? diff : -diff;
    });
  }, [rawParticipants, selectedClassFilter, searchQuery, sortField, sortAsc]);

  if (!isOpen) return null;

  const totalStudents = rawParticipants.length;
  const avgGrade =
    rawParticipants.length > 0
      ? (rawParticipants.reduce((sum, p) => sum + p.gradeScale10, 0) / rawParticipants.length).toFixed(1)
      : '0.0';
  const avgAccuracy =
    rawParticipants.length > 0
      ? Math.round(rawParticipants.reduce((sum, p) => sum + p.accuracyPercent, 0) / rawParticipants.length)
      : 0;

  const handleExportCSV = () => {
    exportGameRosterToCSV(room, filteredParticipants);
    showToast(`Đã xuất bảng điểm ${filteredParticipants.length} sinh viên sang file CSV!`, 'success');
  };

  const handleAwardPoints = () => {
    setAwardedSuccess(true);
    showToast(
      `Đã tự động cộng điểm thưởng UniPoints và huy hiệu "${room.rewardBadgeTitle}" cho toàn bộ sinh viên đạt chuẩn!`,
      'success',
    );
  };

  const handleShareToFeed = () => {
    const top3 = rawParticipants.slice(0, 3);
    const topNames = top3.map((s, idx) => `Top ${idx + 1}: ${s.fullName} (${s.studentCode}) - ${s.score.toLocaleString()} điểm`).join('\n');
    createPost({
      content: `🏆 VINH DANH THỦ KHOA ĐẤU TRƯỜNG HỌC TẬP: "${room.title}"\n\nChúc mừng các bạn sinh viên xuất sắc nhất lớp ${room.targetClassCodes.join(', ')} môn ${room.subjectName}:\n${topNames}\n\nThầy đã cộng điểm rèn luyện & điểm thưởng UniPoints vào hồ sơ. Cả lớp tiếp tục phát huy ở vòng thi tuần sau nhé! 👏🔥`,
      privacy: 'PUBLIC',
      type: 'KNOWLEDGE',
    });
    showToast('Đã đăng bài vinh danh lên Bảng Tin trường (Feed)!', 'success');
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[220] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Chi tiết kết quả đấu trường"
        className="bg-fb-card rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] overflow-hidden flex flex-col border border-fb-divider animate-in zoom-in-95 duration-150"
      >
        {/* ================= HEADER ================= */}
        <div className="p-4 sm:p-5 border-b border-fb-divider flex items-start justify-between gap-4 bg-fb-card">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-fb-blue uppercase tracking-wider">
                {room.subjectCode} · {room.subjectName}
              </span>
              <span className="text-xs text-fb-text-3">·</span>
              <span className="text-xs font-medium text-fb-text-2">
                Lớp tín chỉ: {room.targetClassCodes.includes('ALL') ? 'Toàn trường' : room.targetClassCodes.join(', ')}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-fb-text truncate">
              {room.title}
            </h2>
            <p className="text-xs text-fb-text-2 mt-0.5">
              Tổ chức bởi: <strong className="text-fb-text">{room.hostName}</strong> · Mã PIN: <span className="font-mono font-bold text-yellow-600 dark:text-yellow-400">{room.joinPin}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              title="Xuất bảng điểm Excel/CSV chuẩn nộp Đào tạo"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất CSV / Excel</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Đóng"
              className="w-9 h-9 rounded-xl hover:bg-fb-hover text-fb-text-2 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= KPI METRICS STRIP ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:px-5 bg-fb-input border-b border-fb-divider text-xs">
          <div className="p-2 sm:p-2.5 rounded-lg bg-fb-card border border-fb-divider">
            <span className="text-fb-text-2 block text-[11px]">Tổng SV tham gia</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base sm:text-lg font-bold text-fb-text tabular-nums">{totalStudents}</strong>
              <span className="text-[10px] text-emerald-600 font-semibold">(96.3% sĩ số)</span>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-fb-card border border-fb-divider">
            <span className="text-fb-text-2 block text-[11px]">Điểm TB hệ 10</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base sm:text-lg font-bold text-fb-blue tabular-nums">{avgGrade} / 10</strong>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-fb-card border border-fb-divider">
            <span className="text-fb-text-2 block text-[11px]">Tỉ lệ trả lời đúng</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base sm:text-lg font-bold text-emerald-600 tabular-nums">{avgAccuracy}%</strong>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-fb-card border border-fb-divider">
            <span className="text-fb-text-2 block text-[11px]">Thưởng UniPoints</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base sm:text-lg font-bold text-yellow-600 dark:text-yellow-400 tabular-nums">
                +{(totalStudents * room.rewardPoints * 0.75).toLocaleString()} đ
              </strong>
            </div>
          </div>
        </div>

        {/* ================= NAVIGATION TABS ================= */}
        <div className="flex items-center justify-between px-5 border-b border-fb-divider bg-fb-card text-xs font-semibold select-none">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('ROSTER')}
              className={`py-3 px-3.5 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'ROSTER'
                  ? 'border-fb-blue text-fb-blue font-bold'
                  : 'border-transparent text-fb-text-2 hover:text-fb-text'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Bảng Điểm Cá Nhân & Điểm Danh</span>
            </button>

            <button
              onClick={() => setActiveTab('CLASSES')}
              className={`py-3 px-3.5 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'CLASSES'
                  ? 'border-fb-blue text-fb-blue font-bold'
                  : 'border-transparent text-fb-text-2 hover:text-fb-text'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>So Sánh Giữa Các Lớp Tín Chỉ</span>
            </button>

            <button
              onClick={() => setActiveTab('ANALYTICS')}
              className={`py-3 px-3.5 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'ANALYTICS'
                  ? 'border-fb-blue text-fb-blue font-bold'
                  : 'border-transparent text-fb-text-2 hover:text-fb-text'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Phân Tích Bẫy & Lỗi Sai Sư Phạm</span>
            </button>
          </div>

          {/* Quick teacher actions */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handleAwardPoints}
              disabled={awardedSuccess}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                awardedSuccess
                  ? 'bg-fb-input text-fb-text-3 cursor-not-allowed'
                  : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{awardedSuccess ? 'Đã cấp điểm cống hiến' : 'Cộng điểm thưởng tự động'}</span>
            </button>

            <button
              onClick={handleShareToFeed}
              className="px-3 py-1.5 rounded-lg bg-fb-blue-soft text-fb-blue text-xs font-bold hover:bg-fb-blue-soft/80 transition flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Vinh danh lên Feed</span>
            </button>
          </div>
        </div>

        {/* ================= TAB CONTENT VIEW ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'ROSTER' && (
            <div className="space-y-3.5">
              {/* Filter & Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-fb-input p-2.5 rounded-xl border border-fb-divider">
                {/* Search */}
                <div className="relative flex-1 w-full sm:w-auto">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fb-text-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo MSSV, Họ tên hoặc Lớp sinh hoạt..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-fb-card text-xs text-fb-text placeholder:text-fb-text-3 border border-fb-divider outline-none focus:ring-2 focus:ring-fb-blue/40"
                  />
                </div>

                {/* Filter by Course Class */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs font-semibold text-fb-text-2 shrink-0">Lớp tín chỉ:</label>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-fb-card text-xs font-semibold text-fb-text border border-fb-divider outline-none focus:ring-2 focus:ring-fb-blue/40"
                  >
                    <option value="ALL">Tất cả lớp ({rawParticipants.length} SV)</option>
                    {room.targetClassCodes.map((c) => (
                      <option key={c} value={c}>
                        Lớp {c}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setSortAsc((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded-lg bg-fb-card border border-fb-divider hover:bg-fb-hover text-xs font-medium text-fb-text flex items-center gap-1 shrink-0"
                    title="Đổi thứ tự sắp xếp"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>{sortAsc ? 'Tăng dần' : 'Giảm dần'}</span>
                  </button>
                </div>
              </div>

              {/* High Density Student Table (Tabular figures) */}
              <div className="border border-fb-divider rounded-xl overflow-hidden shadow-xs bg-fb-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-fb-input/70 border-b border-fb-divider text-fb-text-2 font-bold select-none">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-12">Hạng</th>
                        <th className="py-2.5 px-3">MSSV</th>
                        <th className="py-2.5 px-3">Họ và Tên</th>
                        <th className="py-2.5 px-3">Lớp tín chỉ</th>
                        <th className="py-2.5 px-3">Lớp sinh hoạt</th>
                        <th className="py-2.5 px-3 text-center">Đúng / Tổng</th>
                        <th className="py-2.5 px-3 text-right">Điểm hệ 10</th>
                        <th className="py-2.5 px-3 text-right">Điểm đấu trường</th>
                        <th className="py-2.5 px-3 text-right">UniPoints</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-fb-divider">
                      {filteredParticipants.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-fb-text-3">
                            Không tìm thấy sinh viên nào khớp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        filteredParticipants.map((student) => (
                          <tr
                            key={student.id}
                            className="hover:bg-fb-hover/60 transition-colors font-medium text-fb-text"
                          >
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-[11px] tabular-nums ${
                                  student.rank === 1
                                    ? 'bg-yellow-400 text-black'
                                    : student.rank === 2
                                    ? 'bg-slate-300 text-black'
                                    : student.rank === 3
                                    ? 'bg-amber-600 text-white'
                                    : 'text-fb-text-2'
                                }`}
                              >
                                {student.rank}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono font-semibold tabular-nums text-fb-blue">
                              {student.studentCode}
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-bold flex items-center gap-1.5">
                                <span>{student.fullName}</span>
                                {student.maxStreak >= 3 && (
                                  <span className="text-[10px] text-amber-500 font-normal flex items-center">
                                    <Flame className="w-3 h-3 fill-amber-500" />
                                    {student.maxStreak}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3 font-semibold text-fb-text-2">
                              Lớp {student.courseClassCode}
                            </td>
                            <td className="py-2 px-3 text-fb-text-2 truncate max-w-[140px]">
                              {student.homeClass}
                            </td>
                            <td className="py-2 px-3 text-center tabular-nums">
                              <span className="font-bold text-fb-text">
                                {student.correctAnswersCount}
                              </span>
                              <span className="text-fb-text-3">/{student.totalQuestionsCount}</span>
                              <span className="text-[10px] text-fb-text-2 ml-1">
                                ({student.accuracyPercent}%)
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums">
                              <span
                                className={`font-black text-sm ${
                                  student.gradeScale10 >= 8.5
                                    ? 'text-emerald-600'
                                    : student.gradeScale10 >= 7.0
                                    ? 'text-fb-blue'
                                    : 'text-amber-600'
                                }`}
                              >
                                {student.gradeScale10.toFixed(1)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold tabular-nums text-fb-text">
                              {student.score.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-yellow-600 dark:text-yellow-400 tabular-nums">
                              +{student.pointsAwarded} đ
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CLASSES' && (
            <div className="space-y-4">
              <div className="p-4 bg-fb-blue-soft rounded-xl border border-fb-blue/20">
                <h3 className="text-sm font-bold text-fb-blue flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  So Sánh Chất Lượng Học Tập Giữa Các Lớp Tín Chỉ
                </h3>
                <p className="text-xs text-fb-text-2 mt-1">
                  Mỗi sinh viên có thể học nhiều môn khác nhau. Bảng này giúp Giảng viên đánh giá mức độ đồng đều giữa các lớp học phần mình đang phụ trách.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {classComparisons.map((c) => (
                  <div
                    key={c.courseClassCode}
                    className="p-4 rounded-xl border border-fb-divider bg-fb-card shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-fb-blue">
                          Lớp tín chỉ: {c.courseClassCode}
                        </span>
                        <h4 className="text-sm font-bold text-fb-text mt-0.5">
                          {c.subjectName}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-fb-input text-xs font-bold text-fb-text tabular-nums">
                        {c.participatedCount} / {c.totalEnrolled} SV ({c.participationRate}%)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-fb-input rounded-lg text-xs">
                      <div>
                        <span className="text-fb-text-2 block text-[11px]">Điểm TB Lớp:</span>
                        <strong className="text-base font-black text-fb-blue tabular-nums">
                          {c.averageGrade} / 10
                        </strong>
                      </div>
                      <div>
                        <span className="text-fb-text-2 block text-[11px]">Điểm Thủ Khoa:</span>
                        <strong className="text-base font-black text-emerald-600 tabular-nums">
                          {c.topScore} / 10
                        </strong>
                      </div>
                    </div>

                    <div className="text-xs text-fb-text-2">
                      <span className="font-semibold text-fb-danger">Chương cần củng cố lại: </span>
                      <span className="font-medium text-fb-text">{c.weakestChapter}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ANALYTICS' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Phân Tích Độ Phân Hóa & Bẫy Đề Thi (Item Distractor Analysis)
                </h3>
                <p className="text-xs text-fb-text-2 mt-1">
                  Tự động phát hiện các câu hỏi có tỉ lệ chọn phương án nhiễu cao, chỉ ra lỗ hổng kiến thức chung của sinh viên để giảng viên giảng giải lại.
                </p>
              </div>

              <div className="space-y-3.5">
                {questionAnalytics.map((q) => (
                  <div
                    key={q.questionId}
                    className="p-4 rounded-xl border border-fb-divider bg-fb-card shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-fb-blue-soft text-fb-blue font-bold text-xs">
                            Câu {q.questionIndex}
                          </span>
                          <span className="text-xs text-fb-text-2 font-medium">
                            {q.chapter}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            q.difficulty === 'HARD' ? 'bg-rose-100 text-rose-700' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-fb-text leading-snug">
                          {q.questionText}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs text-fb-text-2 block">Tỉ lệ đúng:</span>
                        <span
                          className={`text-lg font-black tabular-nums ${
                            q.correctPercent >= 75
                              ? 'text-emerald-600'
                              : q.correctPercent >= 50
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {q.correctPercent}%
                        </span>
                      </div>
                    </div>

                    {/* Options Breakdown Bar */}
                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt) => {
                        const isCorrect = opt.id === q.correctAnswer;
                        return (
                          <div key={opt.id} className="text-xs space-y-0.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className={`font-semibold flex items-center gap-1 ${
                                isCorrect ? 'text-emerald-600 font-bold' : 'text-fb-text-2'
                              }`}>
                                <span className="w-4 h-4 rounded-sm bg-fb-input flex items-center justify-center text-[10px] font-bold">
                                  {opt.id}
                                </span>
                                {opt.text} {isCorrect && '✓ (Đáp án chuẩn)'}
                              </span>
                              <span className="font-mono tabular-nums text-fb-text">
                                {opt.pickPercent}% ({opt.pickCount} SV)
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-fb-input overflow-hidden">
                              <div
                                style={{ width: `${opt.pickPercent}%` }}
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isCorrect ? 'bg-emerald-500' : 'bg-slate-400/60'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pedagogical Commentary */}
                    <div className="p-3 bg-fb-input/70 rounded-lg text-xs text-fb-text-2 leading-relaxed">
                      <strong className="text-fb-text font-semibold">Nhận xét sư phạm: </strong>
                      {q.commonMistakePedagogicalNote}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
