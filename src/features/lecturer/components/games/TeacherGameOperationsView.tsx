import React, { useState, useMemo } from 'react';
import {
  Gamepad2,
  Plus,
  Search,
  Filter,
  Radio,
  Clock,
  Users,
  Trophy,
  CheckCircle2,
  FileSpreadsheet,
  Play,
  Eye,
  Lock,
  Layers,
  Sparkles,
  BookOpen,
  LayoutGrid,
  List,
  GraduationCap,
  Copy,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { TeacherGameRoom, GameMode, GameStatus } from '../../types/teacherGameTypes';
import {
  loadStoredTeacherGames,
  saveStoredTeacherGames,
  exportGameRosterToCSV,
  getParticipantsForGame,
} from '../../mockTeacherGames';
import { MOCK_SUBJECTS, MOCK_COURSE_CLASSES } from '../../mockExamData';
import { CreateGameModal } from './CreateGameModal';
import { LiveGameHostModal } from './LiveGameHostModal';
import { GameResultsModal } from './GameResultsModal';
import { useApp } from '../../../demo/context/AppContext';

export const TeacherGameOperationsView: React.FC = () => {
  const { showToast } = useApp();

  const [games, setGames] = useState<TeacherGameRoom[]>(() => loadStoredTeacherGames());
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeHostRoom, setActiveHostRoom] = useState<TeacherGameRoom | null>(null);
  const [activeResultsRoom, setActiveResultsRoom] = useState<TeacherGameRoom | null>(null);

  // Multi-dimensional filter
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Search
      const term = searchQuery.trim().toLowerCase();
      const matchSearch =
        !term ||
        game.title.toLowerCase().includes(term) ||
        game.joinPin.includes(term) ||
        game.subjectName.toLowerCase().includes(term) ||
        game.subjectCode.toLowerCase().includes(term);

      // Subject
      const matchSubject = subjectFilter === 'ALL' || String(game.subjectId) === subjectFilter;

      // Class
      const matchClass =
        classFilter === 'ALL' ||
        game.targetClassCodes.includes('ALL') ||
        game.targetClassCodes.includes(classFilter);

      // Mode
      const matchMode = modeFilter === 'ALL' || game.gameMode === modeFilter;

      // Status
      const matchStatus = statusFilter === 'ALL' || game.status === statusFilter;

      return matchSearch && matchSubject && matchClass && matchMode && matchStatus;
    });
  }, [games, searchQuery, subjectFilter, classFilter, modeFilter, statusFilter]);

  // Handle new game created
  const handleGameCreated = (newRoom: TeacherGameRoom) => {
    const updated = [newRoom, ...games];
    setGames(updated);
    saveStoredTeacherGames(updated);
  };

  // Handle finish game
  const handleFinishGame = (roomId: string) => {
    const updated = games.map((g) =>
      g.id === roomId
        ? {
            ...g,
            status: 'COMPLETED' as GameStatus,
            endedAt: new Date().toISOString(),
          }
        : g,
    );
    setGames(updated);
    saveStoredTeacherGames(updated);
    showToast('Đã lưu kết quả vòng thi vào hệ thống!', 'success');
  };

  // Summary Metrics
  const totalLive = games.filter((g) => g.status === 'RUNNING').length;
  const totalParticipantsAll = games.reduce((acc, g) => acc + g.totalParticipants, 0);
  const avgOverallGrade =
    games.length > 0
      ? (games.reduce((acc, g) => acc + (g.averageGrade || 7.5), 0) / games.length).toFixed(1)
      : '8.0';
  const totalRewardsDistributed = games.reduce(
    (acc, g) => acc + g.totalParticipants * (g.rewardPoints || 250),
    0,
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ================= HEADER SECTION ================= */}
      <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-fb-blue text-white flex items-center justify-center font-bold">
              <Gamepad2 className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-fb-blue uppercase tracking-wider">
              Dành riêng cho Giảng viên & Ban Đào Tạo
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-fb-text">
            Trung Tâm Điều Hành Trò Chơi & Đấu Trường Học Tập
          </h1>
          <p className="text-xs sm:text-sm text-fb-text-2 mt-1 max-w-2xl">
            Tổ chức đấu trường Kahoot trực tiếp trên lớp học, giao thử thách tự luyện tuần và tự động xuất bảng điểm cho từng lớp tín chỉ.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-fb-blue hover:bg-fb-blue-hover text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Trò Chơi Mới</span>
          </button>
        </div>
      </div>

      {/* ================= 4 KPI SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-fb-card p-4 rounded-xl shadow-fb-card border border-fb-divider flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-fb-text-2 block">Phòng đấu đang mở (LIVE)</span>
            <strong className="text-2xl font-black text-fb-blue tabular-nums mt-0.5 block">
              {totalLive} phòng
            </strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-fb-blue-soft text-fb-blue flex items-center justify-center font-bold">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-fb-card p-4 rounded-xl shadow-fb-card border border-fb-divider flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-fb-text-2 block">Tổng lượt SV tham gia</span>
            <strong className="text-2xl font-black text-fb-text tabular-nums mt-0.5 block">
              {totalParticipantsAll.toLocaleString()} lượt
            </strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-fb-card p-4 rounded-xl shadow-fb-card border border-fb-divider flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-fb-text-2 block">Điểm trung bình toàn khoá</span>
            <strong className="text-2xl font-black text-emerald-600 tabular-nums mt-0.5 block">
              {avgOverallGrade} / 10
            </strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-fb-card p-4 rounded-xl shadow-fb-card border border-fb-divider flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-fb-text-2 block">Điểm thưởng UniPoints đã cấp</span>
            <strong className="text-2xl font-black text-yellow-600 dark:text-yellow-400 tabular-nums mt-0.5 block">
              +{totalRewardsDistributed.toLocaleString()} đ
            </strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-yellow-600 dark:bg-amber-950/40 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ================= MULTI-DIMENSIONAL FILTER TOOLBAR ================= */}
      <div className="bg-fb-card rounded-2xl shadow-fb-card p-4 border border-fb-divider space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-fb-text-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm trò chơi theo tên môn, chủ đề hoặc mã PIN 6 số..."
              className="w-full pl-10 pr-3 py-2 rounded-xl bg-fb-input border border-fb-divider text-xs text-fb-text placeholder:text-fb-text-3 outline-none focus:ring-2 focus:ring-fb-blue/40"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-fb-input rounded-xl border border-fb-divider self-end lg:self-auto shrink-0 select-none">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'GRID' ? 'bg-fb-card text-fb-blue shadow-xs font-bold' : 'text-fb-text-2 hover:text-fb-text'
              }`}
              title="Chế độ Thẻ phòng đấu"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Dạng Thẻ</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'TABLE' ? 'bg-fb-card text-fb-blue shadow-xs font-bold' : 'text-fb-text-2 hover:text-fb-text'
              }`}
              title="Chế độ Bảng dữ liệu chi tiết"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Dạng Bảng</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters (Subject, Class, Mode, Status) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Subject Filter */}
          <div>
            <label className="text-[11px] font-bold text-fb-text-2 block mb-1">Môn học:</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-fb-input border border-fb-divider text-xs text-fb-text font-semibold outline-none focus:ring-2 focus:ring-fb-blue/40"
            >
              <option value="ALL">Tất cả môn học</option>
              {MOCK_SUBJECTS.map((s) => (
                <option key={s.subject_id} value={String(s.subject_id)}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter (Addresses cross-enrolled students!) */}
          <div>
            <label className="text-[11px] font-bold text-fb-text-2 block mb-1">Lớp tín chỉ:</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-fb-input border border-fb-divider text-xs text-fb-text font-semibold outline-none focus:ring-2 focus:ring-fb-blue/40"
            >
              <option value="ALL">Tất cả các lớp</option>
              {MOCK_COURSE_CLASSES.map((c) => (
                <option key={c.class_code} value={c.class_code}>
                  Lớp {c.class_code} ({c.subject_code})
                </option>
              ))}
            </select>
          </div>

          {/* Game Mode Filter */}
          <div>
            <label className="text-[11px] font-bold text-fb-text-2 block mb-1">Hình thức:</label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-fb-input border border-fb-divider text-xs text-fb-text font-semibold outline-none focus:ring-2 focus:ring-fb-blue/40"
            >
              <option value="ALL">Tất cả hình thức</option>
              <option value="LIVE_ARENA">Đấu trường Live Kahoot</option>
              <option value="WEEKLY_QUEST">Thử thách tự luyện tuần</option>
              <option value="PREDICTION_CHALLENGE">Minigame dự đoán</option>
              <option value="PEER_DUEL">Đấu cặp 1vs1</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-bold text-fb-text-2 block mb-1">Trạng thái:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-fb-input border border-fb-divider text-xs text-fb-text font-semibold outline-none focus:ring-2 focus:ring-fb-blue/40"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="RUNNING">🟢 Đang Live</option>
              <option value="SCHEDULED">⏰ Đã lên lịch</option>
              <option value="COMPLETED">✓ Đã kết thúc</option>
              <option value="DRAFT">Bản nháp</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT LIST / GRID ================= */}
      {filteredGames.length === 0 ? (
        <div className="bg-fb-card rounded-2xl shadow-fb-card p-12 text-center border border-fb-divider">
          <Gamepad2 className="w-12 h-12 text-fb-text-3 mx-auto mb-3" />
          <h3 className="text-base font-bold text-fb-text">Không tìm thấy trò chơi nào</h3>
          <p className="text-xs text-fb-text-2 mt-1 max-w-sm mx-auto">
            Không có phòng đấu nào phù hợp với bộ lọc hiện tại. Thầy/Cô hãy thử đổi môn học hoặc bấm tạo trò chơi mới!
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-fb-blue text-white text-xs font-bold hover:bg-fb-blue-hover transition"
          >
            Tạo Trò Chơi Mới Ngay
          </button>
        </div>
      ) : viewMode === 'GRID' ? (
        /* ================= GRID VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGames.map((game) => {
            const isLive = game.status === 'RUNNING';
            const isDone = game.status === 'COMPLETED';

            return (
              <div
                key={game.id}
                className={`bg-fb-card rounded-2xl shadow-fb-card border transition-all duration-200 p-5 flex flex-col justify-between gap-4 ${
                  isLive
                    ? 'border-fb-blue ring-2 ring-fb-blue/20'
                    : 'border-fb-divider hover:border-fb-divider/80'
                }`}
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs">
                          <Radio className="w-3 h-3 animate-pulse" />
                          ĐANG TRỰC TIẾP
                        </span>
                      ) : isDone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/10 text-fb-text-2 font-bold text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          ĐÃ KẾT THÚC
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                          <Clock className="w-3 h-3" />
                          ĐÃ LÊN LỊCH
                        </span>
                      )}

                      <span className="text-xs font-semibold text-fb-text-2">
                        {game.subjectCode} · {game.subjectName}
                      </span>
                    </div>

                    {/* PIN Display */}
                    <div className="bg-fb-input border border-fb-divider px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-fb-text-2 uppercase font-medium">PIN:</span>
                      <span className="font-mono font-bold text-xs text-yellow-600 dark:text-yellow-400 tabular-nums">
                        {game.joinPin}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(game.joinPin);
                          showToast('Đã sao chép mã PIN!', 'success');
                        }}
                        className="text-fb-text-3 hover:text-fb-text"
                        title="Sao chép PIN"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="font-bold text-base text-fb-text leading-snug">
                      {game.title}
                    </h3>
                    <p className="text-xs text-fb-text-2 line-clamp-2 mt-1">
                      {game.description}
                    </p>
                  </div>

                  {/* Target Classes chips */}
                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-fb-text-2">
                    <span className="font-semibold text-fb-text">Lớp áp dụng:</span>
                    {game.targetClassCodes.includes('ALL') ? (
                      <span className="px-2 py-0.5 rounded-md bg-fb-input text-fb-text font-medium">
                        Toàn bộ các lớp
                      </span>
                    ) : (
                      game.targetClassCodes.map((code) => (
                        <span
                          key={code}
                          className="px-2 py-0.5 rounded-md bg-fb-blue-soft text-fb-blue font-bold"
                        >
                          Lớp {code}
                        </span>
                      ))
                    )}
                  </div>

                  {/* Metrics preview */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-fb-input rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-fb-text-2 block">Sinh viên</span>
                      <strong className="font-bold text-fb-text tabular-nums">
                        {game.totalParticipants} SV
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-fb-text-2 block">Điểm TB</span>
                      <strong className="font-bold text-fb-blue tabular-nums">
                        {game.averageGrade || 8.0} / 10
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-fb-text-2 block">Thưởng</span>
                      <strong className="font-bold text-yellow-600 dark:text-yellow-400 tabular-nums">
                        +{game.rewardPoints} đ
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-fb-divider flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Operate Live Button */}
                    {(isLive || game.status === 'SCHEDULED') && (
                      <button
                        onClick={() => setActiveHostRoom(game)}
                        className="px-3.5 py-1.5 rounded-xl bg-fb-blue hover:bg-fb-blue-hover text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Vận hành phòng Live</span>
                      </button>
                    )}

                    {/* View Results Button */}
                    <button
                      onClick={() => setActiveResultsRoom(game)}
                      className="px-3 py-1.5 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-semibold transition flex items-center gap-1.5 border border-fb-divider"
                    >
                      <Eye className="w-3.5 h-3.5 text-fb-blue" />
                      <span>Xem Kết quả</span>
                    </button>
                  </div>

                  {/* Export CSV quick button */}
                  <button
                    onClick={() => {
                      const participants = getParticipantsForGame(game.id);
                      exportGameRosterToCSV(game, participants);
                      showToast(`Đã xuất bảng điểm môn ${game.subjectCode} sang file CSV!`, 'success');
                    }}
                    className="p-2 rounded-xl hover:bg-fb-hover text-fb-text-2 hover:text-emerald-600 transition"
                    title="Xuất nhanh bảng điểm CSV cho phòng Đào tạo"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= HIGH-DENSITY TABLE VIEW ================= */
        <div className="bg-fb-card rounded-2xl shadow-fb-card border border-fb-divider overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-fb-input/70 border-b border-fb-divider text-fb-text-2 font-bold select-none">
                <tr>
                  <th className="py-3 px-4">Tên Trò Chơi & Đấu Trường</th>
                  <th className="py-3 px-3">Môn học</th>
                  <th className="py-3 px-3">Lớp áp dụng</th>
                  <th className="py-3 px-3 text-center">Mã PIN</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-3 text-center">Số SV</th>
                  <th className="py-3 px-3 text-right">Điểm TB</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fb-divider">
                {filteredGames.map((game) => (
                  <tr key={game.id} className="hover:bg-fb-hover/60 transition-colors font-medium text-fb-text">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-sm text-fb-text leading-snug">{game.title}</p>
                        <p className="text-[11px] text-fb-text-2 truncate max-w-sm">{game.description}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-fb-blue whitespace-nowrap">
                      {game.subjectCode} - {game.subjectName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-fb-text-2">
                        {game.targetClassCodes.includes('ALL') ? 'Toàn trường' : game.targetClassCodes.join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-yellow-600 dark:text-yellow-400 bg-fb-input px-2 py-0.5 rounded-md">
                        {game.joinPin}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          game.status === 'RUNNING'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : game.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {game.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums font-bold">
                      {game.totalParticipants}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-black text-fb-blue">
                      {game.averageGrade || 8.0}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {(game.status === 'RUNNING' || game.status === 'SCHEDULED') && (
                          <button
                            onClick={() => setActiveHostRoom(game)}
                            className="px-2.5 py-1 rounded-lg bg-fb-blue hover:bg-fb-blue-hover text-white font-bold text-[11px] transition flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Vận hành</span>
                          </button>
                        )}
                        <button
                          onClick={() => setActiveResultsRoom(game)}
                          className="px-2.5 py-1 rounded-lg bg-fb-input hover:bg-fb-hover text-fb-text font-bold text-[11px] transition flex items-center gap-1 border border-fb-divider"
                        >
                          <Eye className="w-3 h-3 text-fb-blue" />
                          <span>Kết quả</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}
      <CreateGameModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onGameCreated={handleGameCreated}
      />

      {activeHostRoom && (
        <LiveGameHostModal
          room={activeHostRoom}
          isOpen={true}
          onClose={() => setActiveHostRoom(null)}
          onFinishGame={handleFinishGame}
        />
      )}

      {activeResultsRoom && (
        <GameResultsModal
          room={activeResultsRoom}
          isOpen={true}
          onClose={() => setActiveResultsRoom(null)}
        />
      )}
    </div>
  );
};
