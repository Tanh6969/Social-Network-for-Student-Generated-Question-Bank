import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Heart,
  Database,
  AlertTriangle,
  Bot,
  FileSpreadsheet,
  Check,
  X,
  Search,
  Filter,
  Clock,
  Award,
  Share2,
  Info,
  Calendar,
  Lock,
  Flame,
  HelpCircle,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trophy,
  Server,
  Send,
  ShieldCheck,
  Coins,
} from 'lucide-react';
import {
  OfficialMinigameId,
  MG1_Session,
  MG2_SessionPrediction,
  MG3_Session,
  MG4_Session,
  MG5_ErrorReport,
  MG6_Session,
} from '../../types/officialMinigames';
import {
  loadMG1,
  saveMG1,
  loadMG2,
  saveMG2,
  loadMG3,
  saveMG3,
  loadMG4,
  saveMG4,
  loadMG5,
  saveMG5,
  loadMG6,
  saveMG6,
  resolveMG1,
  resolveMG4,
  auditMG5Report,
  releaseMG5EndOfTermBounty,
  exportOfficialMinigameToCSV,
} from '../../mockOfficialMinigames';
import { MOCK_SUBJECTS, MOCK_COURSE_CLASSES } from '../../mockExamData';
import { useApp } from '../../../demo/context/AppContext';
import { gamesApi, LeaderboardResponse, MyCourseClassPredictionDto } from '../../../../api';

type TabViewMode = OfficialMinigameId | 'LEADERBOARD_ADMIN';

export const OfficialTeacherGameHub: React.FC = () => {
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState<TabViewMode>('MG1_PARTICIPANTS');

  // Global Filters across Subjects and Course Classes
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedClassCode, setSelectedClassCode] = useState<string>('ALL');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');

  // Status Filter per Minigame
  const [filterMG1, setFilterMG1] = useState<'ALL' | 'WINNERS' | 'NON_WINNERS'>('ALL');
  const [filterMG2, setFilterMG2] = useState<'ALL' | 'EXACT' | 'NON_EXACT' | 'AI' | 'HUMAN'>('ALL');
  const [filterMG3, setFilterMG3] = useState<'ALL' | 'QUALIFIED' | 'NOT_QUALIFIED'>('ALL');
  const [filterMG4, setFilterMG4] = useState<'ALL' | 'TOP3' | 'OTHERS'>('ALL');
  const [filterMG5, setFilterMG5] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'DISMISSED' | 'RELEASED'>('ALL');
  const [filterMG6, setFilterMG6] = useState<'ALL' | 'FASTEST' | 'ALL_CORRECT' | 'OTHERS'>('ALL');

  // Datasets
  const [mg1, setMg1] = useState<MG1_Session>(() => loadMG1());
  const [mg2List, setMg2List] = useState<MG2_SessionPrediction[]>(() => loadMG2());
  const [mg3, setMg3] = useState<MG3_Session>(() => loadMG3());
  const [mg4, setMg4] = useState<MG4_Session>(() => loadMG4());
  const [mg5List, setMg5List] = useState<MG5_ErrorReport[]>(() => loadMG5());
  const [mg6, setMg6] = useState<MG6_Session>(() => loadMG6());

  // Leaderboard data from GET /games/leaderboard
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'SEMESTER' | 'SUBJECT'>('SEMESTER');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [isRebuildingLeaderboard, setIsRebuildingLeaderboard] = useState(false);
  const [isFinalizingSemester, setIsFinalizingSemester] = useState(false);

  // Game 1 Class Predictions from GET /games/prediction/game-1/classes
  const [game1Classes, setGame1Classes] = useState<MyCourseClassPredictionDto[]>([]);

  // MG1 Modal/Input
  const [mg1ActualInput, setMg1ActualInput] = useState<number>(mg1.currentActualProposers);

  // MG4 Modal/Input
  const [mg4ActualInput, setMg4ActualInput] = useState<number>(mg4.currentBankSize);

  // MG3 Accordion Toggle for 10 Questions
  const [showMG3Questions, setShowMG3Questions] = useState<boolean>(true);

  // MG5 Audit Notes inline
  const [auditNotes, setAuditNotes] = useState<Record<string, string>>({});
  const [isAuditing, setIsAuditing] = useState<Record<string, boolean>>({});

  // Current Subject Object
  const currentSubjectObj = useMemo(() => {
    if (selectedSubjectId === 'ALL') return null;
    return MOCK_SUBJECTS.find((s) => String(s.subject_id) === selectedSubjectId) || null;
  }, [selectedSubjectId]);

  // Load Leaderboard on mount or period change
  useEffect(() => {
    let cancelled = false;
    gamesApi
      .getLeaderboard({
        period: leaderboardPeriod,
        subject_id: selectedSubjectId !== 'ALL' ? Number(selectedSubjectId) : undefined,
      })
      .then((res) => {
        if (!cancelled) setLeaderboardData(res);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [leaderboardPeriod, selectedSubjectId]);

  // Load Game 1 Classes
  useEffect(() => {
    let cancelled = false;
    gamesApi
      .getGame1Classes()
      .then((data) => {
        if (!cancelled) setGame1Classes(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------------------------------------------------------------
  // Reactive Filtering Logic
  // --------------------------------------------------------------------------

  // Minigame 1 Filtered List
  const filteredMG1Predictions = useMemo(() => {
    return mg1.predictions.filter((p) => {
      if (selectedClassCode !== 'ALL' && p.courseClassCode !== selectedClassCode) return false;
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.trim().toLowerCase();
        const match =
          p.studentName.toLowerCase().includes(q) ||
          p.studentCode.toLowerCase().includes(q) ||
          p.courseClassCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      const diff = Math.abs(p.guessedCount - mg1.currentActualProposers);
      const err = (diff / mg1.currentActualProposers) * 100;
      const isWin = p.isWinner !== undefined ? p.isWinner : err <= 5.0;
      if (filterMG1 === 'WINNERS' && !isWin) return false;
      if (filterMG1 === 'NON_WINNERS' && isWin) return false;
      return true;
    });
  }, [mg1, selectedClassCode, searchStudentQuery, filterMG1]);

  // Minigame 2 Filtered List
  const filteredMG2List = useMemo(() => {
    return mg2List.filter((p) => {
      if (selectedClassCode !== 'ALL' && p.courseClassCode !== selectedClassCode) return false;
      if (currentSubjectObj?.name && !p.subjectName.toLowerCase().includes(currentSubjectObj.name.toLowerCase())) {
        return false;
      }
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.trim().toLowerCase();
        const match =
          p.studentName.toLowerCase().includes(q) ||
          p.studentCode.toLowerCase().includes(q) ||
          p.courseClassCode.toLowerCase().includes(q) ||
          p.sessionTitle.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterMG2 === 'EXACT' && !p.isExact) return false;
      if (filterMG2 === 'NON_EXACT' && p.isExact) return false;
      if (filterMG2 === 'AI' && p.groupType !== 'AI') return false;
      if (filterMG2 === 'HUMAN' && p.groupType !== 'HUMAN') return false;
      return true;
    });
  }, [mg2List, selectedClassCode, currentSubjectObj, searchStudentQuery, filterMG2]);

  // Minigame 3 Filtered Submissions
  const filteredMG3Submissions = useMemo(() => {
    return mg3.submissions.filter((s) => {
      if (selectedClassCode !== 'ALL' && s.courseClassCode !== selectedClassCode) return false;
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.trim().toLowerCase();
        const match =
          s.studentName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.courseClassCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      const isQualified = s.isQualifiedBonus ?? ((s.accuracyPercent ?? 0) >= 50);
      if (filterMG3 === 'QUALIFIED' && !isQualified) return false;
      if (filterMG3 === 'NOT_QUALIFIED' && isQualified) return false;
      return true;
    });
  }, [mg3, selectedClassCode, searchStudentQuery, filterMG3]);

  // Minigame 4 Filtered Predictions
  const filteredMG4Predictions = useMemo(() => {
    return mg4.predictions.filter((p) => {
      if (selectedClassCode !== 'ALL' && p.courseClassCode !== selectedClassCode) return false;
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.trim().toLowerCase();
        const match =
          p.studentName.toLowerCase().includes(q) ||
          p.studentCode.toLowerCase().includes(q) ||
          p.courseClassCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterMG4 === 'TOP3' && !p.isTop3Winner) return false;
      if (filterMG4 === 'OTHERS' && p.isTop3Winner) return false;
      return true;
    });
  }, [mg4, selectedClassCode, searchStudentQuery, filterMG4]);

  // Minigame 5 Filtered Reports
  const filteredMG5List = useMemo(() => {
    return mg5List.filter((r) => {
      if (
        selectedClassCode !== 'ALL' &&
        r.courseClassCode !== selectedClassCode &&
        r.reporterClass !== selectedClassCode &&
        r.authorClass !== selectedClassCode
      ) {
        return false;
      }
      if (currentSubjectObj?.name && !r.subjectName.toLowerCase().includes(currentSubjectObj.name.toLowerCase())) {
        return false;
      }
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.trim().toLowerCase();
        const match =
          r.reporterName.toLowerCase().includes(q) ||
          r.reporterStudentCode.toLowerCase().includes(q) ||
          r.authorName.toLowerCase().includes(q) ||
          r.authorStudentCode.toLowerCase().includes(q) ||
          r.questionContent.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterMG5 === 'PENDING' && r.teacherAuditStatus !== 'PENDING') return false;
      if (filterMG5 === 'CONFIRMED' && r.teacherAuditStatus !== 'CONFIRMED_FAULTY') return false;
      if (filterMG5 === 'DISMISSED' && r.teacherAuditStatus !== 'DISMISSED') return false;
      if (filterMG5 === 'RELEASED' && !r.isReleasedAtEndOfTerm) return false;
      return true;
    });
  }, [mg5List, selectedClassCode, currentSubjectObj, searchStudentQuery, filterMG5]);

  // Minigame 6 Filtered Submissions
  const filteredMG6Submissions = useMemo(() => {
    return mg6.submissions.filter((s) => {
      if (selectedClassCode !== 'ALL' && s.courseClassCode !== selectedClassCode) return false;
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.trim().toLowerCase();
        const match =
          s.studentName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.courseClassCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterMG6 === 'FASTEST' && !s.isFastestWinner) return false;
      if (filterMG6 === 'ALL_CORRECT' && !s.isAllCorrect) return false;
      if (filterMG6 === 'OTHERS' && (s.isFastestWinner || s.isAllCorrect)) return false;
      return true;
    });
  }, [mg6, selectedClassCode, searchStudentQuery, filterMG6]);

  // --------------------------------------------------------------------------
  // API Action Handlers
  // --------------------------------------------------------------------------

  // Admin/Teacher: Rebuild Leaderboard in Redis (POST /admin/leaderboards/rebuild)
  const handleRebuildLeaderboard = async () => {
    setIsRebuildingLeaderboard(true);
    try {
      const res = await gamesApi.rebuildLeaderboard({
        type: leaderboardPeriod,
        subject_id: selectedSubjectId !== 'ALL' ? Number(selectedSubjectId) : undefined,
      });
      showToast(res.message, 'success');
      // Refresh leaderboard data
      const refreshed = await gamesApi.getLeaderboard({
        period: leaderboardPeriod,
        subject_id: selectedSubjectId !== 'ALL' ? Number(selectedSubjectId) : undefined,
      });
      setLeaderboardData(refreshed);
    } catch {
      showToast('Đồng bộ Redis thất bại, vui lòng kiểm tra kết nối', 'error');
    } finally {
      setIsRebuildingLeaderboard(false);
    }
  };

  // Admin/Teacher: Finalize Semester (POST /admin/semesters/finalize-semester)
  const handleFinalizeSemester = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn chốt sổ học kỳ? Hệ thống sẽ khóa điểm, tổng kết Game 4, lưu trữ câu hỏi và giải ngân điểm thưởng săn lỗi Game 5.')) {
      return;
    }
    setIsFinalizingSemester(true);
    try {
      const res = await gamesApi.finalizeSemester();
      showToast(res.message, 'success');
      // Reload local MG5 and MG4 state
      setMg5List(loadMG5());
      setMg4(loadMG4());
    } catch {
      showToast('Chốt sổ học kỳ thất bại', 'error');
    } finally {
      setIsFinalizingSemester(false);
    }
  };

  // Game 5: Audit Review (POST /questions/{questionId}/ratings/{ratingUserId}/review-error)
  const handleAuditMG5Api = async (report: MG5_ErrorReport, isConfirmed: boolean) => {
    const reportId = report.id;
    setIsAuditing((prev) => ({ ...prev, [reportId]: true }));
    const note = auditNotes[reportId] || (isConfirmed ? 'Xác nhận câu hỏi bị lỗi.' : 'Bác bỏ báo cáo.');

    try {
      // Numerical question ID and rating user ID
      const numericQId = Number(report.questionId.replace(/\D/g, '')) || 107;
      const numericUserId = Number(report.reporterId.replace(/\D/g, '')) || 101;

      const res = await gamesApi.reviewError(numericQId, numericUserId, {
        is_comfirmed: isConfirmed,
        notes: note,
      });

      // Update state
      const updated = auditMG5Report(reportId, isConfirmed, note);
      setMg5List(updated);
      showToast(res.message, isConfirmed ? 'success' : 'info');
    } catch {
      showToast('Thẩm định báo lỗi thất bại', 'error');
    } finally {
      setIsAuditing((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  // Resolve Minigame 1
  const handleResolveMG1 = () => {
    const updated = resolveMG1(mg1, mg1ActualInput);
    setMg1(updated);
    const winners = updated.predictions.filter((p) => p.isWinner);
    showToast(
      `Đã chốt Game 1 với ${mg1ActualInput} SV nộp bài! Có ${winners.length} sinh viên đoán trúng trong dải ±5%.`,
      'success',
    );
  };

  // Resolve Minigame 3
  const handleResolveMG3 = () => {
    const updatedSubmissions = mg3.submissions.map((sub) => {
      let matches = 0;
      mg3.tenQuestions.forEach((q) => {
        if (sub.guesses[q.questionId] === q.isPopular) matches++;
      });
      const pct = (matches / 10) * 100;
      return {
        ...sub,
        correctMatchesCount: matches,
        accuracyPercent: pct,
        isQualifiedBonus: matches >= 5,
      };
    });
    const updated: MG3_Session = {
      ...mg3,
      status: 'RESOLVED',
      submissions: updatedSubmissions,
    };
    setMg3(updated);
    saveMG3(updated);
    const qualifiedCount = updatedSubmissions.filter((s) => s.isQualifiedBonus).length;
    showToast(`Đã chốt Minigame 3! Có ${qualifiedCount} sinh viên đoán đúng >= 50% nhận +0.25 điểm quá trình.`, 'success');
  };

  // Resolve Minigame 4 (POST /games/prediction/bank-size & finalize)
  const handleResolveMG4 = () => {
    const updated = resolveMG4(mg4, mg4ActualInput);
    setMg4(updated);
    showToast(`Đã chốt Ngân hàng đề với ${mg4ActualInput} câu! Đã vinh danh đúng Top 3 sinh viên chuẩn nhất và sớm nhất.`, 'success');
  };

  // Resolve Minigame 6
  const handleResolveMG6 = () => {
    const fastest = mg6.submissions.find((s) => s.isFastestWinner);
    showToast(
      fastest
        ? `Đã chốt Minigame 6! Bạn ${fastest.studentName} (${fastest.studentCode}) là người đoán đúng 100% sớm nhất (+${fastest.pointsAwarded}đ)!`
        : 'Đã cập nhật trạng thái Minigame 6.',
      'success',
    );
  };

  // --------------------------------------------------------------------------
  // CSV Exporters
  // --------------------------------------------------------------------------
  const handleExportMG1 = () => {
    const dataToExport = filteredMG1Predictions.length > 0 ? filteredMG1Predictions : mg1.predictions;
    const headers = ['STT', 'MSSV', 'Họ và Tên', 'Lớp tín chỉ', 'Số dự đoán', 'Sai số (%)', 'Kết quả', 'Thời gian gửi'];
    const rows = dataToExport.map((p, idx) => [
      idx + 1,
      p.studentCode,
      p.studentName,
      p.courseClassCode,
      p.guessedCount,
      p.errorPercent !== undefined ? `${p.errorPercent}%` : 'Chờ chốt',
      p.isWinner ? 'Đoán trúng (±5%)' : 'Không trúng',
      new Date(p.submittedAt).toLocaleString('vi-VN'),
    ]);
    exportOfficialMinigameToCSV('Game1_Participants_Prediction', headers, rows);
    showToast(`Đã tải CSV Game 1 (${rows.length} dòng)!`, 'success');
  };

  const handleExportMG2 = () => {
    const dataToExport = filteredMG2List.length > 0 ? filteredMG2List : mg2List;
    const headers = ['STT', 'MSSV', 'Họ và Tên', 'Lớp', 'Môn học', 'Nhóm câu', 'Số câu tự đoán', 'Số câu GV duyệt', 'Kết quả', 'Điểm thưởng'];
    const rows = dataToExport.map((p, idx) => [
      idx + 1,
      p.studentCode,
      p.studentName,
      p.courseClassCode,
      p.subjectName,
      p.groupType === 'AI' ? 'AI tạo' : 'Tự làm',
      p.predictedApprovedCount,
      p.actualApprovedCount ?? 'Chưa duyệt',
      p.isExact ? 'Chính xác 100%' : 'Sai lệch',
      p.pointsAwarded ?? 0,
    ]);
    exportOfficialMinigameToCSV('Game2_Approved_Questions_Prediction', headers, rows);
    showToast(`Đã tải CSV Game 2 (${rows.length} dòng)!`, 'success');
  };

  const handleExportMG3 = () => {
    const dataToExport = filteredMG3Submissions.length > 0 ? filteredMG3Submissions : mg3.submissions;
    const headers = ['STT', 'MSSV', 'Họ và Tên', 'Lớp', 'Số câu đoán đúng (/10)', 'Tỉ lệ đúng (%)', 'Điểm cộng quá trình'];
    const rows = dataToExport.map((s, idx) => [
      idx + 1,
      s.studentCode,
      s.studentName,
      s.courseClassCode,
      `${s.correctMatchesCount ?? 0}/10`,
      `${s.accuracyPercent ?? 0}%`,
      s.isQualifiedBonus ? `+${mg3.bonusGradeValue}đ` : '0đ',
    ]);
    exportOfficialMinigameToCSV('Game3_Popularity_Bonus', headers, rows);
    showToast(`Đã tải CSV Game 3 (${rows.length} dòng)!`, 'success');
  };

  const handleExportMG4 = () => {
    const dataToExport = filteredMG4Predictions.length > 0 ? filteredMG4Predictions : mg4.predictions;
    const headers = ['Hạng', 'MSSV', 'Họ và Tên', 'Lớp', 'Số dự đoán', 'Chênh lệch', 'Thời gian gửi', 'Phần thưởng'];
    const rows = dataToExport.map((p) => [
      p.rank ?? '-',
      p.studentCode,
      p.studentName,
      p.courseClassCode,
      p.predictedSize,
      p.diff !== undefined ? `${p.diff} câu` : '-',
      new Date(p.submittedAt).toLocaleString('vi-VN'),
      p.isTop3Winner ? `+${p.pointsAwarded} UniPoints (Top ${p.rank})` : 'Không giải',
    ]);
    exportOfficialMinigameToCSV('Game4_Bank_Size_Top3', headers, rows);
    showToast(`Đã tải CSV Game 4 (${rows.length} dòng)!`, 'success');
  };

  const handleExportMG5 = () => {
    const dataToExport = filteredMG5List.length > 0 ? filteredMG5List : mg5List;
    const headers = ['Mã báo cáo', 'Môn học', 'Lớp', 'Câu hỏi', 'Người báo lỗi', 'MSSV người báo', 'Tác giả câu hỏi', 'MSSV tác giả', 'Trạng thái thẩm định', 'Phạt tác giả', 'Thưởng người báo', 'Đã công bố cuối kỳ'];
    const rows = dataToExport.map((r) => [
      r.id,
      r.subjectName,
      r.courseClassCode,
      `"${r.questionContent.slice(0, 50)}..."`,
      r.reporterName,
      r.reporterStudentCode,
      r.authorName,
      r.authorStudentCode,
      r.teacherAuditStatus === 'CONFIRMED_FAULTY' ? 'Lỗi xác nhận' : r.teacherAuditStatus === 'DISMISSED' ? 'Bác bỏ' : 'Chờ duyệt',
      r.penaltyPointsForAuthor,
      r.bountyPointsForReporter,
      r.isReleasedAtEndOfTerm ? 'Đã công bố cuối kỳ' : 'Đang tạm giữ',
    ]);
    exportOfficialMinigameToCSV('Game5_Review_Error_Reports', headers, rows);
    showToast(`Đã tải CSV Game 5 (${rows.length} dòng)!`, 'success');
  };

  const handleExportMG6 = () => {
    const dataToExport = filteredMG6Submissions.length > 0 ? filteredMG6Submissions : mg6.submissions;
    const headers = ['STT', 'MSSV', 'Họ và Tên', 'Lớp', 'Số câu đúng', 'Tổng câu', 'Đúng hết 100%', 'Nộp sớm nhất', 'Thời gian nộp', 'Điểm thưởng'];
    const rows = dataToExport.map((s, idx) => [
      idx + 1,
      s.studentCode,
      s.studentName,
      s.courseClassCode,
      s.correctCount ?? 0,
      s.totalQuestions ?? 7,
      s.isAllCorrect ? 'Có' : 'Không',
      s.isFastestWinner ? 'Thủ khoa sớm nhất' : 'Không',
      new Date(s.submittedAt).toLocaleString('vi-VN'),
      s.pointsAwarded ?? 0,
    ]);
    exportOfficialMinigameToCSV('Game6_LLM_Turing_Test', headers, rows);
    showToast(`Đã tải CSV Game 6 (${rows.length} dòng)!`, 'success');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ================= TOP HEADER SECTION ================= */}
      <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Database className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                API 21. Gamification & Minigames
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-fb-blue-soft text-fb-blue">
                Giảng viên & Admin Vận Hành
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-fb-text">
              Trung Tâm Điều Hành Gamification & 6 Minigame
            </h1>
            <p className="text-xs sm:text-sm text-fb-text-2 mt-1 max-w-3xl">
              Hệ thống quản trị trực tiếp dựa trên Swagger API 21: Thẩm định câu lỗi 0⭐ (<code className="font-mono text-emerald-600">/review-error</code>), Đồng bộ bảng xếp hạng Redis (<code className="font-mono text-emerald-600">/rebuild</code>), Chốt sổ học kỳ (<code className="font-mono text-emerald-600">/finalize-semester</code>) và điều hành 6 trò chơi dự đoán.
            </p>
          </div>

          {/* Quick Admin Operations Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            <button
              onClick={handleRebuildLeaderboard}
              disabled={isRebuildingLeaderboard}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              title="POST /admin/leaderboards/rebuild - Tái tạo bảng xếp hạng trên Redis ZSet"
            >
              <RefreshCw className={`w-4 h-4 ${isRebuildingLeaderboard ? 'animate-spin' : ''}`} />
              <span>Đồng bộ Redis ZSet</span>
            </button>

            <button
              onClick={handleFinalizeSemester}
              disabled={isFinalizingSemester}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              title="POST /admin/semesters/finalize-semester - Khóa điểm, chốt Game 4 và giải ngân Game 5"
            >
              <Award className="w-4 h-4" />
              <span>Chốt Sổ Học Kỳ</span>
            </button>
          </div>
        </div>

        {/* Global Multi-subject, Class, and Student Filter Bar */}
        <div className="pt-3 border-t border-fb-divider flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-fb-text-2 block mb-0.5">Môn học phụ trách:</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-fb-input border border-fb-divider text-xs font-semibold text-fb-text outline-none focus:ring-1 focus:ring-fb-blue"
              >
                <option value="ALL">Tất cả môn học</option>
                {MOCK_SUBJECTS.map((s) => (
                  <option key={s.subject_id} value={String(s.subject_id)}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-fb-text-2 block mb-0.5">Lớp tín chỉ:</label>
              <select
                value={selectedClassCode}
                onChange={(e) => setSelectedClassCode(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-fb-input border border-fb-divider text-xs font-semibold text-fb-text outline-none focus:ring-1 focus:ring-fb-blue"
              >
                <option value="ALL">Tất cả lớp tín chỉ</option>
                {MOCK_COURSE_CLASSES.map((c) => (
                  <option key={c.class_code} value={c.class_code}>
                    Lớp {c.class_code} ({c.subject_code})
                  </option>
                ))}
              </select>
            </div>

            {(selectedSubjectId !== 'ALL' || selectedClassCode !== 'ALL' || searchStudentQuery) && (
              <button
                onClick={() => {
                  setSelectedSubjectId('ALL');
                  setSelectedClassCode('ALL');
                  setSearchStudentQuery('');
                }}
                className="self-end px-2.5 py-1.5 text-xs font-semibold text-fb-danger hover:bg-fb-danger/10 rounded-lg transition flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Đặt lại lọc</span>
              </button>
            )}
          </div>

          {/* Instant Student Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fb-text-3" />
            <input
              type="text"
              value={searchStudentQuery}
              onChange={(e) => setSearchStudentQuery(e.target.value)}
              placeholder="Tìm theo MSSV, Họ tên hoặc Lớp..."
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-fb-input border border-fb-divider text-xs text-fb-text outline-none focus:ring-1 focus:ring-fb-blue placeholder:text-fb-text-3"
            />
            {searchStudentQuery && (
              <button
                onClick={() => setSearchStudentQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fb-text-3 hover:text-fb-text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= 7 NAVIGATION TABS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 select-none">
        {/* Tab 1 */}
        <button
          onClick={() => setActiveTab('MG1_PARTICIPANTS')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeTab === 'MG1_PARTICIPANTS'
              ? 'border-fb-blue bg-fb-blue-soft text-fb-blue ring-2 ring-fb-blue/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Game 1</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">SV Nộp Bài</h4>
            <p className="text-[11px] opacity-80 mt-0.5">Sai số ±5%</p>
          </div>
        </button>

        {/* Tab 2 */}
        <button
          onClick={() => setActiveTab('MG2_APPROVAL_RATE')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeTab === 'MG2_APPROVAL_RATE'
              ? 'border-fb-blue bg-fb-blue-soft text-fb-blue ring-2 ring-fb-blue/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Game 2</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">Tỷ Lệ Duyệt</h4>
            <p className="text-[11px] opacity-80 mt-0.5">AI vs Con người</p>
          </div>
        </button>

        {/* Tab 3 */}
        <button
          onClick={() => setActiveTab('MG3_POPULARITY')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeTab === 'MG3_POPULARITY'
              ? 'border-fb-blue bg-fb-blue-soft text-fb-blue ring-2 ring-fb-blue/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Game 3</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">Độ Yêu Thích</h4>
            <p className="text-[11px] opacity-80 mt-0.5">10 câu · +0.25đ</p>
          </div>
        </button>

        {/* Tab 4 */}
        <button
          onClick={() => setActiveTab('MG4_BANK_SIZE')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeTab === 'MG4_BANK_SIZE'
              ? 'border-fb-blue bg-fb-blue-soft text-fb-blue ring-2 ring-fb-blue/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Game 4</span>
            <Database className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">Ngân Hàng Đề</h4>
            <p className="text-[11px] opacity-80 mt-0.5">Top 3 Quán quân</p>
          </div>
        </button>

        {/* Tab 5 (API Review Error) */}
        <button
          onClick={() => setActiveTab('MG5_REPORT_ERROR')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeTab === 'MG5_REPORT_ERROR'
              ? 'border-amber-500 bg-amber-500/10 text-amber-600 ring-2 ring-amber-500/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Game 5 (API)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">Thẩm Định 0⭐</h4>
            <p className="text-[11px] opacity-80 mt-0.5">/review-error</p>
          </div>
        </button>

        {/* Tab 6 (Turing Test Saturday) */}
        <button
          onClick={() => setActiveTab('MG6_LLM_DETECTION')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeTab === 'MG6_LLM_DETECTION'
              ? 'border-purple-500 bg-purple-500/10 text-purple-600 ring-2 ring-purple-500/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Game 6 (Thứ 7)</span>
            <Bot className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">Dự Đoán LLM</h4>
            <p className="text-[11px] opacity-80 mt-0.5">Turing test 7 câu</p>
          </div>
        </button>

        {/* Tab 7 (Leaderboard & Redis Rebuild) */}
        <button
          onClick={() => setActiveTab('LEADERBOARD_ADMIN')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeTab === 'LEADERBOARD_ADMIN'
              ? 'border-emerald-600 bg-emerald-600/10 text-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Leaderboard</span>
            <Trophy className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">Vinh Danh & Redis</h4>
            <p className="text-[11px] opacity-80 mt-0.5">ZSet /rebuild</p>
          </div>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 1. GAME 1: Dự đoán số sinh viên nộp bài ngày mai (POST /participants) */}
      {/* ===================================================================== */}
      {activeTab === 'MG1_PARTICIPANTS' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    POST /games/prediction/participants
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    GET /games/prediction/game-1/classes
                  </span>
                </div>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  Game 1: Dự Đoán Số Sinh Viên Nộp Bài Ngày Mai
                </h3>
                <p className="text-xs text-fb-text-2">
                  Sinh viên đặt cược trước 22:00 mỗi ngày. Sai số cho phép ±5% nhận điểm thưởng.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMG1}
                  className="px-3.5 py-2 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-bold transition flex items-center gap-1.5 border border-fb-divider cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất CSV ({filteredMG1Predictions.length})</span>
                </button>
              </div>
            </div>

            {/* Benchmark & Target Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-fb-input rounded-xl border border-fb-divider">
              <div>
                <span className="text-xs text-fb-text-2 block">Số người nộp bài thực tế ghi nhận:</span>
                <strong className="text-2xl font-black text-fb-blue tabular-nums block mt-0.5">
                  {mg1.currentActualProposers} sinh viên
                </strong>
                <span className="text-[11px] text-fb-text-3">Chốt cược tự động lúc 22:00 hàng ngày</span>
              </div>

              <div>
                <span className="text-xs text-fb-text-2 block">Dải trúng thưởng hợp lệ (±5%):</span>
                <strong className="text-xl font-bold text-emerald-600 tabular-nums block mt-1">
                  [{Math.round(mg1.currentActualProposers * 0.95)} – {Math.round(mg1.currentActualProposers * 1.05)}] SV
                </strong>
                <span className="text-[11px] text-fb-text-3">Bất kỳ ai đoán trong khoảng này đều nhận thưởng</span>
              </div>

              <div>
                <span className="text-xs text-fb-text-2 block">Thao tác chốt số lượng thực tế của GV:</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={mg1ActualInput}
                    onChange={(e) => setMg1ActualInput(Number(e.target.value))}
                    className="w-24 px-2.5 py-1.5 rounded-lg bg-fb-card border border-fb-divider text-xs font-bold text-fb-text tabular-nums"
                  />
                  <button
                    onClick={handleResolveMG1}
                    className="px-3 py-1.5 rounded-lg bg-fb-blue hover:bg-fb-blue-hover text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Chốt & Trao giải
                  </button>
                </div>
              </div>
            </div>

            {/* Course Classes Status from GET /games/prediction/game-1/classes */}
            {game1Classes.length > 0 && (
              <div className="p-3 bg-fb-card rounded-xl border border-fb-divider space-y-2">
                <span className="text-xs font-bold text-fb-text block">
                  Trạng thái lớp học phần đang mở cược dự đoán (GET /games/prediction/game-1/classes):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {game1Classes.map((cls) => (
                    <div key={cls.course_class_id} className="p-2.5 rounded-lg bg-fb-input border border-fb-divider flex items-center justify-between">
                      <div>
                        <span className="font-bold text-fb-blue">Lớp {cls.class_code}</span>
                        <p className="text-fb-text text-[11px]">{cls.subject_name}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {cls.already_predicted ? `Đã cược (${cls.predicted_count})` : 'Chưa cược'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Predictions Table */}
            <div className="border border-fb-divider rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-fb-input/70 border-b border-fb-divider text-fb-text-2 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">MSSV</th>
                    <th className="py-2.5 px-3">Họ và Tên</th>
                    <th className="py-2.5 px-3">Lớp tín chỉ</th>
                    <th className="py-2.5 px-3 text-center">Con số dự đoán</th>
                    <th className="py-2.5 px-3 text-center">Sai số (%)</th>
                    <th className="py-2.5 px-3 text-center">Thời gian gửi</th>
                    <th className="py-2.5 px-3 text-right">Trạng thái trúng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fb-divider">
                  {filteredMG1Predictions.map((p) => {
                    const diff = Math.abs(p.guessedCount - mg1.currentActualProposers);
                    const err = ((diff / mg1.currentActualProposers) * 100).toFixed(1);
                    const isWin = Number(err) <= 5.0;

                    return (
                      <tr key={p.studentId} className="hover:bg-fb-hover/50 font-medium">
                        <td className="py-2.5 px-3 font-mono font-bold text-fb-blue">{p.studentCode}</td>
                        <td className="py-2.5 px-3 font-bold text-fb-text">{p.studentName}</td>
                        <td className="py-2.5 px-3 text-fb-text-2">Lớp {p.courseClassCode}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-sm tabular-nums text-fb-text">
                          {p.guessedCount}
                        </td>
                        <td className="py-2.5 px-3 text-center tabular-nums">
                          <span className={`font-semibold ${Number(err) <= 5 ? 'text-emerald-600' : 'text-fb-danger'}`}>
                            {err}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-fb-text-2">
                          {new Date(p.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isWin ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                              ✓ Trúng thưởng (+{mg1.rewardPoints}đ)
                            </span>
                          ) : (
                            <span className="text-fb-text-3 text-[11px]">Sai số &gt; 5%</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. GAME 2: Tỷ lệ duyệt AI & Tự làm (POST /approved-questions) */}
      {/* ===================================================================== */}
      {activeTab === 'MG2_APPROVAL_RATE' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  POST /games/prediction/approved-questions
                </span>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  Game 2: Đối Chiếu Dự Đoán Số Câu LLM & Con Người Được Duyệt
                </h3>
                <p className="text-xs text-fb-text-2">
                  Tác giả dự đoán số câu hỏi do AI và Con người tạo ra trong phiên của mình sẽ được GV duyệt vào ngân hàng đề.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMG2}
                  className="px-3.5 py-2 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-bold transition flex items-center gap-1.5 border border-fb-divider cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất CSV ({filteredMG2List.length})</span>
                </button>
              </div>
            </div>

            <div className="border border-fb-divider rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-fb-input/70 border-b border-fb-divider text-fb-text-2 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">MSSV</th>
                    <th className="py-2.5 px-3">Họ và Tên</th>
                    <th className="py-2.5 px-3">Lớp tín chỉ</th>
                    <th className="py-2.5 px-3">Phiên đề xuất</th>
                    <th className="py-2.5 px-3 text-center">Nguồn gốc câu</th>
                    <th className="py-2.5 px-3 text-center">SV đoán duyệt</th>
                    <th className="py-2.5 px-3 text-center">GV duyệt thực tế</th>
                    <th className="py-2.5 px-3 text-right">Kết quả đối chiếu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fb-divider">
                  {filteredMG2List.map((p) => (
                    <tr key={p.id} className="hover:bg-fb-hover/50 font-medium">
                      <td className="py-2.5 px-3 font-mono font-bold text-fb-blue">{p.studentCode}</td>
                      <td className="py-2.5 px-3 font-bold text-fb-text">{p.studentName}</td>
                      <td className="py-2.5 px-3 text-fb-text-2">Lớp {p.courseClassCode}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-fb-text truncate max-w-xs block">{p.sessionTitle}</span>
                        <span className="text-[10px] text-fb-text-3">Tổng {p.totalQuestionsInSession} câu hỏi</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          p.groupType === 'AI' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.groupType === 'AI' ? 'AI Tạo' : 'Tự Làm'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-fb-text tabular-nums">
                        {p.predictedApprovedCount} / {p.totalQuestionsInSession}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold tabular-nums">
                        {p.actualApprovedCount !== undefined ? (
                          <span className="text-fb-blue">{p.actualApprovedCount} / {p.totalQuestionsInSession}</span>
                        ) : (
                          <span className="text-fb-text-3 italic">Chờ GV duyệt</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {p.isExact ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                            ✓ Đoán đúng 100% (+{p.pointsAwarded}đ)
                          </span>
                        ) : (
                          <span className="text-fb-text-3 text-[11px]">Không khớp</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. GAME 3: Độ yêu thích 10 câu hỏi (+0.25đ quá trình) */}
      {/* ===================================================================== */}
      {activeTab === 'MG3_POPULARITY' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold text-xs">
                  Quy tắc: Đúng từ 50% trở lên (≥ 5/10 câu) thì được +0.25 điểm quá trình
                </span>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  Game 3: Đoán Mức Độ Yêu Thích 10 Câu Hỏi Trong Phiên Đề Xuất
                </h3>
                <p className="text-xs text-fb-text-2">
                  Lớp {mg3.courseClassCode} · Môn {mg3.subjectName} · Bao gồm chính xác 10 câu hỏi trắc nghiệm ôn tập
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResolveMG3}
                  className="px-3.5 py-2 rounded-xl bg-fb-blue hover:bg-fb-blue-hover text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Chốt Điểm (+0.25đ)</span>
                </button>
                <button
                  onClick={handleExportMG3}
                  className="px-3.5 py-2 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-bold transition flex items-center gap-1.5 border border-fb-divider cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất CSV ({filteredMG3Submissions.length})</span>
                </button>
              </div>
            </div>

            {/* 10 Questions Preview Accordion */}
            <div className="p-3.5 bg-fb-input rounded-xl border border-fb-divider space-y-2">
              <div
                onClick={() => setShowMG3Questions((prev) => !prev)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <span className="text-xs font-bold text-fb-text flex items-center gap-1.5">
                  <span>Danh sách 10 câu hỏi trong phiên & mức độ ưa thích thực tế của bạn học</span>
                  <span className="text-[11px] font-normal text-fb-text-3">
                    ({mg3.tenQuestions.filter((q) => q.isPopular).length} câu được xếp loại Yêu thích)
                  </span>
                </span>
                <button className="text-fb-text-2 hover:text-fb-text">
                  {showMG3Questions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showMG3Questions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  {mg3.tenQuestions.map((q) => (
                    <div key={q.questionId} className="p-2.5 rounded-lg bg-fb-card border border-fb-divider flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-fb-blue block">Câu {q.questionIndex}:</span>
                        <p className="truncate text-fb-text">{q.content}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        q.isPopular ? 'bg-rose-100 text-rose-700' : 'bg-fb-input text-fb-text-2'
                      }`}>
                        {q.isPopular ? '❤️ Yêu thích' : 'Bình thường'} ({q.actualUpvotes} vote)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Submissions */}
            <div className="border border-fb-divider rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-fb-input/70 border-b border-fb-divider text-fb-text-2 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">MSSV</th>
                    <th className="py-2.5 px-3">Họ và Tên</th>
                    <th className="py-2.5 px-3">Lớp tín chỉ</th>
                    <th className="py-2.5 px-3 text-center">Số câu đoán đúng</th>
                    <th className="py-2.5 px-3 text-center">Tỉ lệ đúng (%)</th>
                    <th className="py-2.5 px-3 text-right">Điểm cộng quá trình</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fb-divider">
                  {filteredMG3Submissions.map((sub) => (
                    <tr key={sub.studentId} className="hover:bg-fb-hover/50 font-medium">
                      <td className="py-2.5 px-3 font-mono font-bold text-fb-blue">{sub.studentCode}</td>
                      <td className="py-2.5 px-3 font-bold text-fb-text">{sub.studentName}</td>
                      <td className="py-2.5 px-3 text-fb-text-2">Lớp {sub.courseClassCode}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-sm tabular-nums text-fb-text">
                        {sub.correctMatchesCount ?? 0} / 10
                      </td>
                      <td className="py-2.5 px-3 text-center tabular-nums">
                        <span className={`font-bold ${
                          (sub.accuracyPercent ?? 0) >= 50 ? 'text-emerald-600' : 'text-fb-danger'
                        }`}>
                          {sub.accuracyPercent ?? 0}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {sub.isQualifiedBonus ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs">
                            +{mg3.bonusGradeValue} điểm (Đạt chuẩn)
                          </span>
                        ) : (
                          <span className="text-fb-text-3 text-[11px]">Chưa đạt (&lt; 50%)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. GAME 4: Quy mô ngân hàng đề & Chốt sổ học kỳ (POST /bank-size & /finalize-semester) */}
      {/* ===================================================================== */}
      {activeTab === 'MG4_BANK_SIZE' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    POST /games/prediction/bank-size
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    POST /admin/semesters/finalize-semester
                  </span>
                </div>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  Game 4: Dự Đoán Tổng Quy Mô Ngân Hàng Câu Hỏi Cuối Kỳ (Top 3)
                </h3>
                <p className="text-xs text-fb-text-2">
                  Dành riêng cho 3 người đoán chính xác nhất & sớm nhất. Kết thúc học kỳ qua API chốt sổ học kỳ.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMG4}
                  className="px-3.5 py-2 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-bold transition flex items-center gap-1.5 border border-fb-divider cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất CSV ({filteredMG4Predictions.length})</span>
                </button>
              </div>
            </div>

            {/* Current Size & Resolve Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-fb-input rounded-xl border border-fb-divider">
              <div>
                <span className="text-xs text-fb-text-2 block">Số lượng câu hỏi trong ngân hàng hiện tại:</span>
                <strong className="text-2xl font-black text-yellow-600 dark:text-yellow-400 tabular-nums block mt-0.5">
                  {mg4.currentBankSize.toLocaleString()} câu hỏi
                </strong>
                <span className="text-[11px] text-fb-text-3">Chỉ tính các câu hỏi đã ở trạng thái APPROVED</span>
              </div>

              <div>
                <span className="text-xs text-fb-text-2 block">Chốt số lượng ngân hàng cuối kỳ:</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={mg4ActualInput}
                    onChange={(e) => setMg4ActualInput(Number(e.target.value))}
                    className="w-28 px-2.5 py-1.5 rounded-lg bg-fb-card border border-fb-divider text-xs font-bold text-fb-text tabular-nums"
                  />
                  <button
                    onClick={handleResolveMG4}
                    className="px-4 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Chốt Top 3 Thắng Cuộc
                  </button>
                </div>
              </div>
            </div>

            {/* Ranked Predictions Table */}
            <div className="border border-fb-divider rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-fb-input/70 border-b border-fb-divider text-fb-text-2 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">Hạng</th>
                    <th className="py-2.5 px-3">MSSV</th>
                    <th className="py-2.5 px-3">Họ và Tên</th>
                    <th className="py-2.5 px-3">Lớp tín chỉ</th>
                    <th className="py-2.5 px-3 text-center">Con số dự đoán</th>
                    <th className="py-2.5 px-3 text-center">Độ chênh lệch</th>
                    <th className="py-2.5 px-3">Thời gian nộp (Ưu tiên nộp sớm)</th>
                    <th className="py-2.5 px-3 text-right">Phần thưởng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fb-divider">
                  {filteredMG4Predictions.map((p) => (
                    <tr
                      key={p.studentId}
                      className={`font-medium transition ${
                        p.isTop3Winner ? 'bg-yellow-500/10' : 'hover:bg-fb-hover/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-bold">
                        {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : p.rank}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-fb-blue">{p.studentCode}</td>
                      <td className="py-2.5 px-3 font-bold text-fb-text">{p.studentName}</td>
                      <td className="py-2.5 px-3 text-fb-text-2">Lớp {p.courseClassCode}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-sm tabular-nums text-fb-text">
                        {p.predictedSize}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold tabular-nums text-fb-text">
                        {p.diff !== undefined ? `±${p.diff} câu` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-fb-text-2">
                        {new Date(p.submittedAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {p.isTop3Winner ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-yellow-400 text-black font-black text-xs">
                            +{p.pointsAwarded} UniPoints
                          </span>
                        ) : (
                          <span className="text-fb-text-3 text-[11px]">Không lọt Top 3</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. GAME 5: Thẩm định báo lỗi câu hỏi 0⭐ (POST /questions/{id}/ratings/{uid}/review-error) */}
      {/* ===================================================================== */}
      {activeTab === 'MG5_REPORT_ERROR' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  POST /questions/{'{questionId}'}/ratings/{'{ratingUserId}'}/review-error
                </span>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  Game 5: Giảng Viên Thẩm Định Báo Lỗi Câu Hỏi (Rate 0⭐)
                </h3>
                <p className="text-xs text-fb-text-2">
                  Xác nhận lỗi thật để trừ điểm tác giả câu hỏi và ghi nhận thưởng cho người báo cáo (điểm thưởng được giải ngân cuối kỳ).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFinalizeSemester}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Chốt sổ học kỳ và trao thưởng điểm săn lỗi cho sinh viên"
                >
                  <Award className="w-4 h-4" />
                  <span>Giải Ngân Điểm Thưởng Cuối Kỳ</span>
                </button>
                <button
                  onClick={handleExportMG5}
                  className="px-3.5 py-2 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-bold transition flex items-center gap-1.5 border border-fb-divider cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất CSV ({filteredMG5List.length})</span>
                </button>
              </div>
            </div>

            {/* List of Error Reports */}
            <div className="space-y-3">
              {filteredMG5List.map((r) => {
                const isItemAuditing = isAuditing[r.id];
                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-xl border transition ${
                      r.teacherAuditStatus === 'CONFIRMED_FAULTY'
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : r.teacherAuditStatus === 'DISMISSED'
                        ? 'border-fb-divider opacity-60 bg-fb-input'
                        : 'border-amber-500/40 bg-amber-500/5'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-fb-blue">#{r.id}</span>
                          <span className="text-xs font-semibold text-fb-text-2">Môn {r.subjectName}</span>
                          <span className="text-xs text-fb-text-3">· Lớp {r.courseClassCode}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                            Rate 0 ⭐
                          </span>
                          {r.isQuestionInApprovedBank && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fb-blue-soft text-fb-blue">
                              Đã trong Ngân Hàng Đề
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-fb-text leading-snug">{r.questionContent}</h4>
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                          Lý do báo lỗi của SV: {r.errorReason}
                        </p>
                      </div>

                      <div className="text-right text-xs shrink-0">
                        <span className="text-fb-text-2 block text-[11px]">Báo cáo bởi:</span>
                        <strong className="text-fb-text font-bold">{r.reporterName} ({r.reporterStudentCode})</strong>
                        <span className="text-fb-text-3 block text-[10px] mt-0.5">
                          Tác giả câu: {r.authorName} ({r.authorStudentCode})
                        </span>
                      </div>
                    </div>

                    {/* Teacher Audit Input & Actions */}
                    <div className="mt-3 pt-3 border-t border-fb-divider space-y-2">
                      {r.teacherAuditStatus === 'PENDING' ? (
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <input
                            type="text"
                            placeholder="Ghi chú thẩm định của giảng viên (notes)..."
                            value={auditNotes[r.id] ?? ''}
                            onChange={(e) => setAuditNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                            className="flex-1 w-full px-3 py-1.5 rounded-lg bg-fb-card border border-fb-divider text-xs text-fb-text outline-none focus:ring-1 focus:ring-fb-blue"
                          />
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => handleAuditMG5Api(r, false)}
                              disabled={isItemAuditing}
                              className="px-3 py-1.5 rounded-lg border border-fb-divider text-xs font-semibold text-fb-text-2 hover:bg-fb-hover cursor-pointer disabled:opacity-50"
                            >
                              Bác bỏ báo lỗi
                            </button>
                            <button
                              onClick={() => handleAuditMG5Api(r, true)}
                              disabled={isItemAuditing}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Xác nhận lỗi & Trừ điểm tác giả</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            {r.teacherAuditStatus === 'CONFIRMED_FAULTY' ? (
                              <>
                                <span className="font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Đã xác nhận lỗi thật:
                                </span>
                                <span className="text-rose-600 font-bold">Chủ câu {r.penaltyPointsForAuthor}đ</span>
                                <span className="text-emerald-600 font-bold">· Người báo +{r.bountyPointsForReporter}đ</span>
                                <span className="text-fb-text-3">({r.isReleasedAtEndOfTerm ? 'Đã công bố cuối kỳ' : 'Đang tạm giữ chờ cuối kỳ'})</span>
                              </>
                            ) : (
                              <span className="text-fb-text-3 italic">Đã bác bỏ báo lỗi (câu hỏi đạt chuẩn)</span>
                            )}
                          </div>
                          {r.teacherAuditNote && (
                            <span className="text-fb-text-2 text-[11px] italic bg-fb-input px-2.5 py-1 rounded-md">
                              "{r.teacherAuditNote}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. GAME 6: Phiên minigame mở Thứ 7 hàng tuần (GET /active-session & POST /submit) */}
      {/* ===================================================================== */}
      {activeTab === 'MG6_LLM_DETECTION' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    GET /games/prediction/active-session
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    POST /games/prediction/submit
                  </span>
                </div>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  Game 6: Phiên Minigame Turing Test Thứ 7 Hàng Tuần (≥ 7 Câu Hỏi)
                </h3>
                <p className="text-xs text-fb-text-2">
                  Phiên minigame mở định kỳ vào Thứ 7. Sinh viên nhìn 7 câu hỏi và dự đoán câu do LLM tạo ra. Đúng hết và sớm nhất được nhận thưởng.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResolveMG6}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Chốt Người Thắng Cuộc</span>
                </button>
                <button
                  onClick={handleExportMG6}
                  className="px-3.5 py-2 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-bold transition flex items-center gap-1.5 border border-fb-divider cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất CSV ({filteredMG6Submissions.length})</span>
                </button>
              </div>
            </div>

            {/* Questions Turing Truth View for Teacher */}
            <div className="p-3.5 bg-fb-input rounded-xl border border-fb-divider space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-fb-text">
                  Bảng Đáp Án Nguồn Gốc Thật Sự (Chỉ Giảng Viên được nhìn thấy):
                </span>
                <span className="text-[11px] text-purple-600 font-semibold">
                  Tỉ lệ: {mg6.questions.filter((q) => q.actualOrigin === 'AI').length} câu AI / {mg6.questions.length} câu
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {mg6.questions.map((q, idx) => (
                  <div key={q.id} className="p-2.5 rounded-lg bg-fb-card border border-fb-divider flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-fb-blue">Câu {idx + 1} ({q.chapter}):</span>
                      <p className="truncate text-fb-text">{q.content}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                      q.actualOrigin === 'AI' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {q.actualOrigin === 'AI' ? `🤖 LLM (${q.aiModel ?? 'AI'})` : '👤 Tự Làm'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submissions & Winner ranking */}
            <div className="border border-fb-divider rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-fb-input/70 border-b border-fb-divider text-fb-text-2 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">MSSV</th>
                    <th className="py-2.5 px-3">Họ và Tên</th>
                    <th className="py-2.5 px-3">Lớp tín chỉ</th>
                    <th className="py-2.5 px-3 text-center">Đúng / Tổng câu</th>
                    <th className="py-2.5 px-3 text-center">Thời gian nộp</th>
                    <th className="py-2.5 px-3 text-right">Phần thưởng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fb-divider">
                  {filteredMG6Submissions.map((s) => (
                    <tr
                      key={s.studentId}
                      className={`font-medium transition ${
                        s.isFastestWinner ? 'bg-purple-500/10' : 'hover:bg-fb-hover/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-fb-blue">{s.studentCode}</td>
                      <td className="py-2.5 px-3 font-bold text-fb-text">
                        <div className="flex items-center gap-1.5">
                          <span>{s.studentName}</span>
                          {s.isFastestWinner && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black">
                              🏆 SỚM NHẤT & ĐÚNG HẾT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-fb-text-2">Lớp {s.courseClassCode}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-sm tabular-nums text-fb-text">
                        {s.correctCount} / {s.totalQuestions}
                      </td>
                      <td className="py-2.5 px-3 text-center text-fb-text-2">
                        {new Date(s.submittedAt).toLocaleTimeString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {s.isFastestWinner ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-bold text-xs">
                            +{s.pointsAwarded} UniPoints
                          </span>
                        ) : s.isAllCorrect ? (
                          <span className="text-fb-text-2 text-[11px]">Đúng hết nhưng nộp sau</span>
                        ) : (
                          <span className="text-fb-text-3 text-[11px]">Không trúng</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. BẢNG XẾP HẠNG & QUẢN TRỊ REDIS (GET /leaderboard & POST /rebuild) */}
      {/* ===================================================================== */}
      {activeTab === 'LEADERBOARD_ADMIN' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    GET /games/leaderboard
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    POST /admin/leaderboards/rebuild
                  </span>
                </div>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  Bảng Xếp Hạng Vinh Danh Sinh Viên & Đồng Bộ Redis ZSet
                </h3>
                <p className="text-xs text-fb-text-2">
                  Xem bảng xếp hạng tích lũy điểm trong học kỳ hoặc theo môn học kèm công cụ tái tạo Redis tức thì.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLeaderboardPeriod('SEMESTER')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    leaderboardPeriod === 'SEMESTER'
                      ? 'bg-fb-blue text-white shadow-xs'
                      : 'bg-fb-input text-fb-text-2 hover:bg-fb-hover'
                  }`}
                >
                  Theo Học Kỳ (SEMESTER)
                </button>
                <button
                  onClick={() => setLeaderboardPeriod('SUBJECT')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    leaderboardPeriod === 'SUBJECT'
                      ? 'bg-fb-blue text-white shadow-xs'
                      : 'bg-fb-input text-fb-text-2 hover:bg-fb-hover'
                  }`}
                >
                  Theo Môn Học (SUBJECT)
                </button>
              </div>
            </div>

            {/* Podium Top 3 */}
            {leaderboardData && leaderboardData.entries && leaderboardData.entries.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto py-4 text-center items-end">
                {/* 2nd Place */}
                <div className="p-3 bg-fb-input rounded-xl border border-fb-divider flex flex-col items-center">
                  <span className="text-[11px] font-bold text-fb-text-2">HẠNG 2 🥈</span>
                  <p className="font-bold text-xs text-fb-text mt-1 truncate max-w-full">
                    {leaderboardData.entries[1].full_name}
                  </p>
                  <span className="text-[11px] text-fb-text-3 font-mono">{leaderboardData.entries[1].user_code}</span>
                  <span className="text-xs font-bold text-fb-blue mt-1">{leaderboardData.entries[1].total_points} điểm</span>
                </div>

                {/* 1st Place */}
                <div className="p-4 bg-emerald-500/10 rounded-xl border-2 border-emerald-500 flex flex-col items-center shadow-xs">
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                    <Trophy className="w-4 h-4" /> QUÁN QUÂN 🥇
                  </span>
                  <p className="font-black text-sm text-fb-text mt-1 truncate max-w-full">
                    {leaderboardData.entries[0].full_name}
                  </p>
                  <span className="text-[11px] text-fb-text-3 font-mono">{leaderboardData.entries[0].user_code}</span>
                  <span className="text-sm font-black text-emerald-600 mt-1">{leaderboardData.entries[0].total_points} điểm</span>
                </div>

                {/* 3rd Place */}
                <div className="p-3 bg-fb-input rounded-xl border border-fb-divider flex flex-col items-center">
                  <span className="text-[11px] font-bold text-fb-text-2">HẠNG 3 🥉</span>
                  <p className="font-bold text-xs text-fb-text mt-1 truncate max-w-full">
                    {leaderboardData.entries[2].full_name}
                  </p>
                  <span className="text-[11px] text-fb-text-3 font-mono">{leaderboardData.entries[2].user_code}</span>
                  <span className="text-xs font-bold text-fb-blue mt-1">{leaderboardData.entries[2].total_points} điểm</span>
                </div>
              </div>
            )}

            {/* Leaderboard Table */}
            <div className="border border-fb-divider rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-fb-input/70 border-b border-fb-divider text-fb-text-2 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">Hạng</th>
                    <th className="py-2.5 px-3">MSSV</th>
                    <th className="py-2.5 px-3">Họ và Tên</th>
                    <th className="py-2.5 px-3 text-right">Tổng điểm tích lũy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fb-divider">
                  {leaderboardData?.entries?.map((entry) => (
                    <tr key={entry.user_id} className="hover:bg-fb-hover/50 font-medium">
                      <td className="py-2.5 px-3 text-center font-bold">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-fb-blue">{entry.user_code}</td>
                      <td className="py-2.5 px-3 font-bold text-fb-text">{entry.full_name}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-sm text-fb-blue tabular-nums">
                        {entry.total_points} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
