import React, { useState, useMemo } from 'react';
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

export const OfficialTeacherGameHub: React.FC = () => {
  const { showToast } = useApp();

  const [activeMinigame, setActiveMinigame] = useState<OfficialMinigameId>('MG1_PARTICIPANTS');
  
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

  // MG1 Modal/Input
  const [mg1ActualInput, setMg1ActualInput] = useState<number>(mg1.currentActualProposers);

  // MG4 Modal/Input
  const [mg4ActualInput, setMg4ActualInput] = useState<number>(mg4.currentBankSize);

  // MG3 Accordion Toggle for 10 Questions
  const [showMG3Questions, setShowMG3Questions] = useState<boolean>(true);

  // MG5 Audit Notes
  const [auditNotes, setAuditNotes] = useState<Record<string, string>>({});

  // Current Subject Object
  const currentSubjectObj = useMemo(() => {
    if (selectedSubjectId === 'ALL') return null;
    return MOCK_SUBJECTS.find((s) => String(s.subject_id) === selectedSubjectId) || null;
  }, [selectedSubjectId]);

  // --------------------------------------------------------------------------
  // Reactive Filtering Logic
  // --------------------------------------------------------------------------

  // Minigame 1 Filtered List
  const filteredMG1Predictions = useMemo(() => {
    return mg1.predictions.filter((p) => {
      // Class filter
      if (selectedClassCode !== 'ALL' && p.courseClassCode !== selectedClassCode) return false;
      // Search query
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.trim().toLowerCase();
        const match =
          p.studentName.toLowerCase().includes(q) ||
          p.studentCode.toLowerCase().includes(q) ||
          p.courseClassCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Status filter
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
      // Class filter
      if (selectedClassCode !== 'ALL' && p.courseClassCode !== selectedClassCode) return false;
      // Subject filter
      if (currentSubjectObj?.name && !p.subjectName.toLowerCase().includes(currentSubjectObj.name.toLowerCase())) return false;
      // Search query
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.trim().toLowerCase();
        const match =
          p.studentName.toLowerCase().includes(q) ||
          p.studentCode.toLowerCase().includes(q) ||
          p.courseClassCode.toLowerCase().includes(q) ||
          p.sessionTitle.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Status filter
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
      // Class filter
      if (selectedClassCode !== 'ALL' && s.courseClassCode !== selectedClassCode) return false;
      // Search query
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.trim().toLowerCase();
        const match =
          s.studentName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.courseClassCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Status filter
      const isQualified = s.isQualifiedBonus ?? ((s.accuracyPercent ?? 0) >= 50);
      if (filterMG3 === 'QUALIFIED' && !isQualified) return false;
      if (filterMG3 === 'NOT_QUALIFIED' && isQualified) return false;
      return true;
    });
  }, [mg3, selectedClassCode, searchStudentQuery, filterMG3]);

  // Minigame 4 Filtered Predictions
  const filteredMG4Predictions = useMemo(() => {
    return mg4.predictions.filter((p) => {
      // Class filter
      if (selectedClassCode !== 'ALL' && p.courseClassCode !== selectedClassCode) return false;
      // Search query
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.trim().toLowerCase();
        const match =
          p.studentName.toLowerCase().includes(q) ||
          p.studentCode.toLowerCase().includes(q) ||
          p.courseClassCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Status filter
      if (filterMG4 === 'TOP3' && !p.isTop3Winner) return false;
      if (filterMG4 === 'OTHERS' && p.isTop3Winner) return false;
      return true;
    });
  }, [mg4, selectedClassCode, searchStudentQuery, filterMG4]);

  // Minigame 5 Filtered Reports
  const filteredMG5List = useMemo(() => {
    return mg5List.filter((r) => {
      // Class filter
      if (
        selectedClassCode !== 'ALL' &&
        r.courseClassCode !== selectedClassCode &&
        r.reporterClass !== selectedClassCode &&
        r.authorClass !== selectedClassCode
      ) {
        return false;
      }
      // Subject filter
      if (currentSubjectObj?.name && !r.subjectName.toLowerCase().includes(currentSubjectObj.name.toLowerCase())) {
        return false;
      }
      // Search query
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
      // Status filter
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
      // Class filter
      if (selectedClassCode !== 'ALL' && s.courseClassCode !== selectedClassCode) return false;
      // Search query
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.trim().toLowerCase();
        const match =
          s.studentName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.courseClassCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Status filter
      if (filterMG6 === 'FASTEST' && !s.isFastestWinner) return false;
      if (filterMG6 === 'ALL_CORRECT' && !s.isAllCorrect) return false;
      if (filterMG6 === 'OTHERS' && (s.isFastestWinner || s.isAllCorrect)) return false;
      return true;
    });
  }, [mg6, selectedClassCode, searchStudentQuery, filterMG6]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  // Resolve Minigame 1
  const handleResolveMG1 = () => {
    const updated = resolveMG1(mg1, mg1ActualInput);
    setMg1(updated);
    const winners = updated.predictions.filter((p) => p.isWinner);
    showToast(
      `Đã chốt Minigame 1 với ${mg1ActualInput} người đề xuất! Có ${winners.length} sinh viên đoán trúng trong dải ±5%.`,
      'success',
    );
  };

  // Export Minigame 1
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
    exportOfficialMinigameToCSV('Minigame1_DoanSoLuong', headers, rows);
    showToast(`Đã tải file CSV kết quả Minigame 1 (${rows.length} dòng)!`, 'success');
  };

  // Export Minigame 2
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
    exportOfficialMinigameToCSV('Minigame2_DoanTyLeDuyet', headers, rows);
    showToast(`Đã tải file CSV kết quả Minigame 2 (${rows.length} dòng)!`, 'success');
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
        isQualifiedBonus: matches >= 5, // Đúng >= 50%
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

  // Export Minigame 3
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
    exportOfficialMinigameToCSV('Minigame3_DoanMucDoYeuThich', headers, rows);
    showToast(`Đã tải bảng điểm quá trình Minigame 3 (${rows.length} sinh viên)!`, 'success');
  };

  // Resolve Minigame 4
  const handleResolveMG4 = () => {
    const updated = resolveMG4(mg4, mg4ActualInput);
    setMg4(updated);
    showToast(`Đã chốt Ngân hàng đề với ${mg4ActualInput} câu! Đã vinh danh đúng Top 3 sinh viên chuẩn nhất và sớm nhất.`, 'success');
  };

  // Export Minigame 4
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
    exportOfficialMinigameToCSV('Minigame4_DoanNganHangDe_Top3', headers, rows);
    showToast(`Đã xuất bảng xếp hạng Top 3 Minigame 4 (${rows.length} dòng)!`, 'success');
  };

  // Audit Minigame 5 report
  const handleAuditMG5 = (reportId: string, confirmed: boolean) => {
    const note = auditNotes[reportId] || (confirmed ? 'Xác nhận câu hỏi bị lỗi.' : 'Bác bỏ báo cáo.');
    const updated = auditMG5Report(reportId, confirmed, note);
    setMg5List(updated);
    showToast(
      confirmed
        ? 'Đã xác nhận câu lỗi: Chủ câu bị trừ -50đ, người báo cáo được ghi nhận +100đ (tạm giữ đến cuối kỳ).'
        : 'Đã bác bỏ báo lỗi.',
      confirmed ? 'success' : 'info',
    );
  };

  // Release Minigame 5 at End of Term
  const handleReleaseMG5EndOfTerm = () => {
    const { updatedList, releasedCount } = releaseMG5EndOfTermBounty();
    setMg5List(updatedList);
    showToast(
      `Đã công bố kết quả và gửi thông báo cộng điểm săn lỗi cho ${releasedCount} sinh viên vào cuối kỳ học!`,
      'success',
    );
  };

  // Export Minigame 5
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
    exportOfficialMinigameToCSV('Minigame5_BaoCauLoi_0Sao', headers, rows);
    showToast(`Đã tải danh sách thẩm định báo câu lỗi Minigame 5 (${rows.length} dòng)!`, 'success');
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

  // Export Minigame 6
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
    exportOfficialMinigameToCSV('Minigame6_DuDoanCauLLM', headers, rows);
    showToast(`Đã tải file CSV kết quả Minigame 6 Turing Test (${rows.length} dòng)!`, 'success');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ================= HEADER SECTION ================= */}
      <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-fb-blue text-white flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-fb-blue uppercase tracking-wider">
              Quy chuẩn Yêu cầu chức năng Slide 3.1
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-fb-text">
            Trung Tâm Điều Hành 6 Minigame Học Thuật
          </h1>
          <p className="text-xs sm:text-sm text-fb-text-2 mt-1 max-w-3xl">
            Vận hành chính xác 6 cơ chế: Dự đoán số lượng đề xuất (±5%), Tỷ lệ duyệt câu hỏi, Độ yêu thích (+0.25đ), Quy mô ngân hàng đề (Top 3), Thẩm định câu lỗi 0⭐ và Nhận diện câu LLM.
          </p>
        </div>

        {/* Global Multi-subject and Class filter */}
        <div className="flex flex-wrap items-center gap-2 bg-fb-input p-2 rounded-xl border border-fb-divider">
          <div>
            <label className="text-[10px] font-bold text-fb-text-2 block">Môn học:</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-fb-card border border-fb-divider text-xs font-semibold text-fb-text outline-none focus:ring-1 focus:ring-fb-blue"
            >
              <option value="ALL">Tất cả môn phụ trách</option>
              {MOCK_SUBJECTS.map((s) => (
                <option key={s.subject_id} value={String(s.subject_id)}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-fb-text-2 block">Lớp tín chỉ:</label>
            <select
              value={selectedClassCode}
              onChange={(e) => setSelectedClassCode(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-fb-card border border-fb-divider text-xs font-semibold text-fb-text outline-none focus:ring-1 focus:ring-fb-blue"
            >
              <option value="ALL">Tất cả các lớp tín chỉ</option>
              {MOCK_COURSE_CLASSES.map((c) => (
                <option key={c.class_code} value={c.class_code}>
                  Lớp {c.class_code} ({c.subject_code})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Clear Filters Button */}
          {(selectedSubjectId !== 'ALL' || selectedClassCode !== 'ALL' || searchStudentQuery) && (
            <div className="self-end pb-0.5">
              <button
                onClick={() => {
                  setSelectedSubjectId('ALL');
                  setSelectedClassCode('ALL');
                  setSearchStudentQuery('');
                }}
                className="px-2 py-1.5 text-[11px] font-semibold text-fb-text-2 hover:text-fb-danger transition flex items-center gap-1"
                title="Đặt lại tất cả bộ lọc"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa lọc</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= 6 MINIGAMES TAB NAVIGATION BAR ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 select-none">
        {/* Tab 1 */}
        <button
          onClick={() => setActiveMinigame('MG1_PARTICIPANTS')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeMinigame === 'MG1_PARTICIPANTS'
              ? 'border-fb-blue bg-fb-blue-soft text-fb-blue ring-2 ring-fb-blue/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Minigame 1</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">Đoán Số Lượng</h4>
            <p className="text-[11px] opacity-80 mt-0.5">Sai số ±5%</p>
          </div>
        </button>

        {/* Tab 2 */}
        <button
          onClick={() => setActiveMinigame('MG2_APPROVAL_RATE')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeMinigame === 'MG2_APPROVAL_RATE'
              ? 'border-fb-blue bg-fb-blue-soft text-fb-blue ring-2 ring-fb-blue/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Minigame 2</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">Đoán Tỷ Lệ Duyệt</h4>
            <p className="text-[11px] opacity-80 mt-0.5">AI vs Tự làm</p>
          </div>
        </button>

        {/* Tab 3 */}
        <button
          onClick={() => setActiveMinigame('MG3_POPULARITY')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeMinigame === 'MG3_POPULARITY'
              ? 'border-fb-blue bg-fb-blue-soft text-fb-blue ring-2 ring-fb-blue/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Minigame 3</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">Đoán Độ Yêu Thích</h4>
            <p className="text-[11px] opacity-80 mt-0.5">10 câu · +0.25đ</p>
          </div>
        </button>

        {/* Tab 4 */}
        <button
          onClick={() => setActiveMinigame('MG4_BANK_SIZE')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeMinigame === 'MG4_BANK_SIZE'
              ? 'border-fb-blue bg-fb-blue-soft text-fb-blue ring-2 ring-fb-blue/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Minigame 4</span>
            <Database className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">Quy Mô Ngân Hàng</h4>
            <p className="text-[11px] opacity-80 mt-0.5">Top 3 sớm nhất</p>
          </div>
        </button>

        {/* Tab 5 */}
        <button
          onClick={() => setActiveMinigame('MG5_REPORT_ERROR')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeMinigame === 'MG5_REPORT_ERROR'
              ? 'border-fb-blue bg-fb-blue-soft text-fb-blue ring-2 ring-fb-blue/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Minigame 5</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">Báo Câu Lỗi (0⭐)</h4>
            <p className="text-[11px] opacity-80 mt-0.5">Trao thưởng cuối kỳ</p>
          </div>
        </button>

        {/* Tab 6 */}
        <button
          onClick={() => setActiveMinigame('MG6_LLM_DETECTION')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeMinigame === 'MG6_LLM_DETECTION'
              ? 'border-fb-blue bg-fb-blue-soft text-fb-blue ring-2 ring-fb-blue/20 shadow-xs'
              : 'border-fb-divider bg-fb-card text-fb-text hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Minigame 6</span>
            <Bot className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-xs line-clamp-1">Dự Đoán Câu LLM</h4>
            <p className="text-[11px] opacity-80 mt-0.5">≥ 7 câu · Turing test</p>
          </div>
        </button>
      </div>

      {/* ================= SUB-HEADER: SEARCH & QUICK STATUS FILTER ================= */}
      <div className="bg-fb-card rounded-xl p-3 border border-fb-divider flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Instant Search Bar */}
        <div className="relative w-full sm:w-80">
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

        {/* Tab-specific Status Pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          {activeMinigame === 'MG1_PARTICIPANTS' && (
            <>
              <button
                onClick={() => setFilterMG1('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG1 === 'ALL' ? 'bg-fb-blue text-white' : 'bg-fb-input text-fb-text-2 hover:bg-fb-hover'
                }`}
              >
                Tất cả ({mg1.predictions.length})
              </button>
              <button
                onClick={() => setFilterMG1('WINNERS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG1 === 'WINNERS' ? 'bg-emerald-600 text-white' : 'bg-fb-input text-emerald-600 hover:bg-fb-hover'
                }`}
              >
                Đoán trúng (±5%)
              </button>
              <button
                onClick={() => setFilterMG1('NON_WINNERS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG1 === 'NON_WINNERS' ? 'bg-fb-danger text-white' : 'bg-fb-input text-fb-danger hover:bg-fb-hover'
                }`}
              >
                Sai lệch
              </button>
            </>
          )}

          {activeMinigame === 'MG2_APPROVAL_RATE' && (
            <>
              <button
                onClick={() => setFilterMG2('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG2 === 'ALL' ? 'bg-fb-blue text-white' : 'bg-fb-input text-fb-text-2 hover:bg-fb-hover'
                }`}
              >
                Tất cả ({mg2List.length})
              </button>
              <button
                onClick={() => setFilterMG2('EXACT')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG2 === 'EXACT' ? 'bg-emerald-600 text-white' : 'bg-fb-input text-emerald-600 hover:bg-fb-hover'
                }`}
              >
                Trúng 100%
              </button>
              <button
                onClick={() => setFilterMG2('AI')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG2 === 'AI' ? 'bg-purple-600 text-white' : 'bg-fb-input text-purple-600 hover:bg-fb-hover'
                }`}
              >
                Nhóm AI tạo
              </button>
              <button
                onClick={() => setFilterMG2('HUMAN')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG2 === 'HUMAN' ? 'bg-blue-600 text-white' : 'bg-fb-input text-blue-600 hover:bg-fb-hover'
                }`}
              >
                Nhóm Tự làm
              </button>
            </>
          )}

          {activeMinigame === 'MG3_POPULARITY' && (
            <>
              <button
                onClick={() => setFilterMG3('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG3 === 'ALL' ? 'bg-fb-blue text-white' : 'bg-fb-input text-fb-text-2 hover:bg-fb-hover'
                }`}
              >
                Tất cả ({mg3.submissions.length})
              </button>
              <button
                onClick={() => setFilterMG3('QUALIFIED')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG3 === 'QUALIFIED' ? 'bg-emerald-600 text-white' : 'bg-fb-input text-emerald-600 hover:bg-fb-hover'
                }`}
              >
                Đạt chuẩn (≥ 50% / +0.25đ)
              </button>
              <button
                onClick={() => setFilterMG3('NOT_QUALIFIED')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG3 === 'NOT_QUALIFIED' ? 'bg-rose-600 text-white' : 'bg-fb-input text-rose-600 hover:bg-fb-hover'
                }`}
              >
                Chưa đạt (&lt; 50%)
              </button>
            </>
          )}

          {activeMinigame === 'MG4_BANK_SIZE' && (
            <>
              <button
                onClick={() => setFilterMG4('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG4 === 'ALL' ? 'bg-fb-blue text-white' : 'bg-fb-input text-fb-text-2 hover:bg-fb-hover'
                }`}
              >
                Tất cả ({mg4.predictions.length})
              </button>
              <button
                onClick={() => setFilterMG4('TOP3')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG4 === 'TOP3' ? 'bg-yellow-600 text-white' : 'bg-fb-input text-yellow-600 hover:bg-fb-hover'
                }`}
              >
                Top 3 Thắng cuộc
              </button>
              <button
                onClick={() => setFilterMG4('OTHERS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG4 === 'OTHERS' ? 'bg-fb-card text-fb-text border border-fb-divider' : 'bg-fb-input text-fb-text-2 hover:bg-fb-hover'
                }`}
              >
                Ngoài Top 3
              </button>
            </>
          )}

          {activeMinigame === 'MG5_REPORT_ERROR' && (
            <>
              <button
                onClick={() => setFilterMG5('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG5 === 'ALL' ? 'bg-fb-blue text-white' : 'bg-fb-input text-fb-text-2 hover:bg-fb-hover'
                }`}
              >
                Tất cả ({mg5List.length})
              </button>
              <button
                onClick={() => setFilterMG5('PENDING')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG5 === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-fb-input text-amber-600 hover:bg-fb-hover'
                }`}
              >
                Chờ duyệt
              </button>
              <button
                onClick={() => setFilterMG5('CONFIRMED')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG5 === 'CONFIRMED' ? 'bg-emerald-600 text-white' : 'bg-fb-input text-emerald-600 hover:bg-fb-hover'
                }`}
              >
                Lỗi xác nhận
              </button>
              <button
                onClick={() => setFilterMG5('RELEASED')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG5 === 'RELEASED' ? 'bg-purple-600 text-white' : 'bg-fb-input text-purple-600 hover:bg-fb-hover'
                }`}
              >
                Đã giải ngân cuối kỳ
              </button>
            </>
          )}

          {activeMinigame === 'MG6_LLM_DETECTION' && (
            <>
              <button
                onClick={() => setFilterMG6('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG6 === 'ALL' ? 'bg-fb-blue text-white' : 'bg-fb-input text-fb-text-2 hover:bg-fb-hover'
                }`}
              >
                Tất cả ({mg6.submissions.length})
              </button>
              <button
                onClick={() => setFilterMG6('FASTEST')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG6 === 'FASTEST' ? 'bg-purple-600 text-white' : 'bg-fb-input text-purple-600 hover:bg-fb-hover'
                }`}
              >
                Quán quân sớm nhất
              </button>
              <button
                onClick={() => setFilterMG6('ALL_CORRECT')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterMG6 === 'ALL_CORRECT' ? 'bg-emerald-600 text-white' : 'bg-fb-input text-emerald-600 hover:bg-fb-hover'
                }`}
              >
                Đúng hết 100%
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. MINIGAME 1: Đoán số lượng người tham gia đề xuất (±5%) */}
      {/* ===================================================================== */}
      {activeMinigame === 'MG1_PARTICIPANTS' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-fb-blue-soft text-fb-blue text-xs font-bold">
                  Quy tắc: Sai số ±5% nhận điểm thưởng
                </span>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  {mg1.title}
                </h3>
                <p className="text-xs text-fb-text-2">
                  Môn {mg1.subjectCode} · Áp dụng các lớp {mg1.targetClassCodes.join(', ')} · Khung thời gian: {new Date(mg1.startDate).toLocaleDateString('vi-VN')} – {new Date(mg1.endDate).toLocaleDateString('vi-VN')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMG1}
                  className="px-3.5 py-2 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-bold transition flex items-center gap-1.5 border border-fb-divider"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất CSV ({filteredMG1Predictions.length})</span>
                </button>
              </div>
            </div>

            {/* Benchmark & Target Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-fb-input rounded-xl border border-fb-divider">
              <div>
                <span className="text-xs text-fb-text-2 block">Số người đề xuất thực tế (hiện tại):</span>
                <strong className="text-2xl font-black text-fb-blue tabular-nums block mt-0.5">
                  {mg1.currentActualProposers} sinh viên
                </strong>
                <span className="text-[11px] text-fb-text-3">Được cập nhật tự động từ hệ thống nộp bài</span>
              </div>

              <div>
                <span className="text-xs text-fb-text-2 block">Dải trúng thưởng (±5%):</span>
                <strong className="text-xl font-bold text-emerald-600 tabular-nums block mt-1">
                  [{Math.round(mg1.currentActualProposers * 0.95)} – {Math.round(mg1.currentActualProposers * 1.05)}] người
                </strong>
                <span className="text-[11px] text-fb-text-3">Bất kỳ ai đoán trong khoảng này đều nhận thưởng</span>
              </div>

              <div>
                <span className="text-xs text-fb-text-2 block">Thao tác chốt kết quả của GV:</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={mg1ActualInput}
                    onChange={(e) => setMg1ActualInput(Number(e.target.value))}
                    className="w-24 px-2.5 py-1.5 rounded-lg bg-fb-card border border-fb-divider text-xs font-bold text-fb-text tabular-nums"
                  />
                  <button
                    onClick={handleResolveMG1}
                    className="px-3 py-1.5 rounded-lg bg-fb-blue hover:bg-fb-blue-hover text-white text-xs font-bold transition shadow-xs"
                  >
                    Chốt & Trao giải
                  </button>
                </div>
              </div>
            </div>

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
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-[11px]">
                              ✓ Trúng thưởng (+{mg1.rewardPoints}đ)
                            </span>
                          ) : (
                            <span className="text-fb-text-3 text-[11px]">Không trúng (sai số &gt; 5%)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMG1Predictions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-fb-text-3">
                        Không tìm thấy sinh viên nào khớp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. MINIGAME 2: Đoán tỷ lệ duyệt câu hỏi của chính mình */}
      {/* ===================================================================== */}
      {activeMinigame === 'MG2_APPROVAL_RATE' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-fb-blue-soft text-fb-blue text-xs font-bold">
                  Quy tắc: Sinh viên tự đoán chính xác số câu hỏi của chính mình được duyệt
                </span>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  Minigame 2: Đối Chiếu Dự Đoán Tỷ Lệ Duyệt (Nhóm Tự Làm & AI Tạo)
                </h3>
                <p className="text-xs text-fb-text-2">
                  Sinh viên khai báo trung thực nguồn gốc khi gửi phiên đề xuất. Nếu đoán trúng 100% số câu GV phê duyệt sẽ được nhận điểm cộng.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMG2}
                  className="px-3.5 py-2 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-bold transition flex items-center gap-1.5 border border-fb-divider"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất CSV ({filteredMG2List.length})</span>
                </button>
              </div>
            </div>

            {/* List of Student Self-Predictions */}
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
                          p.groupType === 'AI' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
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
                        {p.status === 'PENDING_REVIEW' ? (
                          <span className="text-amber-600 font-semibold text-[11px]">Đang duyệt</span>
                        ) : p.isExact ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-[11px]">
                            ✓ Đoán đúng 100% (+{p.pointsAwarded}đ)
                          </span>
                        ) : (
                          <span className="text-fb-text-3 text-[11px]">Không khớp</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredMG2List.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-fb-text-3">
                        Không tìm thấy phiên dự đoán nào khớp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. MINIGAME 3: Đoán mức độ yêu thích (10 câu hỏi - +0.25đ) */}
      {/* ===================================================================== */}
      {activeMinigame === 'MG3_POPULARITY' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold text-xs">
                  Quy tắc: Đúng từ 50% trở lên (≥ 5/10 câu) thì được +0.25 điểm quá trình
                </span>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  {mg3.title}
                </h3>
                <p className="text-xs text-fb-text-2">
                  Lớp {mg3.courseClassCode} · Môn {mg3.subjectName} · Bao gồm chính xác 10 câu hỏi trắc nghiệm ôn tập
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResolveMG3}
                  className="px-3.5 py-2 rounded-xl bg-fb-blue hover:bg-fb-blue-hover text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Chốt Điểm (+0.25đ)</span>
                </button>
                <button
                  onClick={handleExportMG3}
                  className="px-3.5 py-2 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-bold transition flex items-center gap-1.5 border border-fb-divider"
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
                        q.isPopular ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-fb-input text-fb-text-2'
                      }`}>
                        {q.isPopular ? '❤️ Yêu thích' : 'Bình thường'} ({q.actualUpvotes} vote)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Predictions List */}
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
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-black text-xs">
                            +{mg3.bonusGradeValue} điểm (Đạt chuẩn)
                          </span>
                        ) : (
                          <span className="text-fb-text-3 text-[11px]">Chưa đạt (&lt; 50%)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredMG3Submissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-fb-text-3">
                        Không tìm thấy bài nộp nào khớp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. MINIGAME 4: Đoán số lượng câu có trong ngân hàng đề (Top 3 duy nhất) */}
      {/* ===================================================================== */}
      {activeMinigame === 'MG4_BANK_SIZE' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-yellow-700 dark:text-yellow-400 font-bold text-xs">
                  Quy tắc: Chỉ dành cho 3 người đoán chính xác nhất và sớm nhất · Mỗi người đoán 1 lần
                </span>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  {mg4.title}
                </h3>
                <p className="text-xs text-fb-text-2">
                  Môn {mg4.subjectName} ({mg4.subjectCode}) · Hạn chốt: {new Date(mg4.deadline).toLocaleDateString('vi-VN')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMG4}
                  className="px-3.5 py-2 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-bold transition flex items-center gap-1.5 border border-fb-divider"
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
                <span className="text-[11px] text-fb-text-3">Chỉ tính câu hỏi đã ở trạng thái APPROVED</span>
              </div>

              <div>
                <span className="text-xs text-fb-text-2 block">Chốt con số kiểm định ngân hàng cuối tháng:</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={mg4ActualInput}
                    onChange={(e) => setMg4ActualInput(Number(e.target.value))}
                    className="w-28 px-2.5 py-1.5 rounded-lg bg-fb-card border border-fb-divider text-xs font-bold text-fb-text tabular-nums"
                  />
                  <button
                    onClick={handleResolveMG4}
                    className="px-4 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold transition shadow-xs"
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
                  {filteredMG4Predictions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-fb-text-3">
                        Không tìm thấy dự đoán nào khớp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. MINIGAME 5: Báo câu lỗi rate 0 sao (Chủ câu bị trừ, người báo cộng lúc cuối kỳ) */}
      {/* ===================================================================== */}
      {activeMinigame === 'MG5_REPORT_ERROR' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs">
                  Quy tắc: SV phát hiện câu lỗi rate 0⭐ · Trừ điểm chủ câu · Người báo nhận điểm lúc gần cuối kỳ
                </span>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  Minigame 5: Bảng Thẩm Định Báo Câu Lỗi (0 Sao) & Thưởng Phạt
                </h3>
                <p className="text-xs text-fb-text-2">
                  Để đảm bảo tính khách quan và chống thông đồng, điểm thưởng săn lỗi chỉ được gửi thông báo và giải ngân vào cuối kỳ học.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReleaseMG5EndOfTerm}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  title="Gửi thông báo và cộng điểm cho các bạn săn lỗi vào cuối kỳ học"
                >
                  <Award className="w-4 h-4" />
                  <span>Kích Hoạt Trao Thưởng Cuối Kỳ</span>
                </button>
                <button
                  onClick={handleExportMG5}
                  className="px-3.5 py-2 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-bold transition flex items-center gap-1.5 border border-fb-divider"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất CSV ({filteredMG5List.length})</span>
                </button>
              </div>
            </div>

            {/* List of Error Reports */}
            <div className="space-y-3">
              {filteredMG5List.map((r) => (
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
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
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
                        Lý do báo lỗi: {r.errorReason}
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

                  {/* Audit Actions */}
                  <div className="mt-3 pt-3 border-t border-fb-divider flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="text-xs">
                      {r.teacherAuditStatus === 'CONFIRMED_FAULTY' ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Đã xác nhận lỗi thật:
                          </span>
                          <span className="text-rose-600 font-bold">Chủ câu {r.penaltyPointsForAuthor}đ</span>
                          <span className="text-emerald-600 font-bold">· Người báo +{r.bountyPointsForReporter}đ</span>
                          <span className="text-fb-text-3">({r.isReleasedAtEndOfTerm ? 'Đã công bố cuối kỳ' : 'Đang tạm giữ chờ cuối kỳ'})</span>
                        </div>
                      ) : r.teacherAuditStatus === 'DISMISSED' ? (
                        <span className="text-fb-text-3 italic">Đã bác bỏ (Câu hỏi đạt chuẩn, không có lỗi)</span>
                      ) : (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Đang chờ Giảng viên thẩm định chuyên môn
                        </span>
                      )}
                    </div>

                    {r.teacherAuditStatus === 'PENDING' && (
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => handleAuditMG5(r.id, false)}
                          className="px-3 py-1.5 rounded-lg border border-fb-divider text-xs font-semibold text-fb-text-2 hover:bg-fb-hover"
                        >
                          Bác bỏ
                        </button>
                        <button
                          onClick={() => handleAuditMG5(r.id, true)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Xác nhận lỗi & Trừ điểm chủ câu
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredMG5List.length === 0 && (
                <div className="py-8 text-center text-xs text-fb-text-3 bg-fb-card rounded-xl border border-fb-divider">
                  Không tìm thấy báo cáo lỗi nào khớp với bộ lọc hiện tại.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. MINIGAME 6: Dự đoán câu của LLM (≥ 7 câu - Turing Test) */}
      {/* ===================================================================== */}
      {activeMinigame === 'MG6_LLM_DETECTION' && (
        <div className="space-y-4">
          <div className="bg-fb-card rounded-2xl shadow-fb-card p-5 border border-fb-divider space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fb-divider">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-bold text-xs">
                  Quy tắc: Nhìn tối thiểu 7 câu và đoán câu nào do LLM tạo · Đúng hết và sớm nhất nhận điểm
                </span>
                <h3 className="font-black text-base sm:text-lg text-fb-text mt-1.5">
                  Minigame 6: Đấu Trường Turing Test (Phân Biệt Người Làm vs AI Tạo)
                </h3>
                <p className="text-xs text-fb-text-2">
                  Bộ câu hỏi trắc nghiệm gồm {mg6.questions.length} câu (≥ 7 câu) môn {mg6.subjectName}. Mỗi sinh viên chỉ được làm 1 lần cho một phiên chơi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResolveMG6}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Award className="w-4 h-4" />
                  <span>Chốt Người Thắng Cuộc</span>
                </button>
                <button
                  onClick={handleExportMG6}
                  className="px-3.5 py-2 rounded-xl bg-fb-input hover:bg-fb-hover text-fb-text text-xs font-bold transition flex items-center gap-1.5 border border-fb-divider"
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
                      q.actualOrigin === 'AI' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
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
                  {filteredMG6Submissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-fb-text-3">
                        Không tìm thấy bài làm nào khớp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
