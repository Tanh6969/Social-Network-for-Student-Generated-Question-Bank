import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  GraduationCap,
  Users,
  Info,
  CheckSquare,
  Shuffle,
  FileCode,
} from 'lucide-react';
import {
  examsApi,
  GenerateExamRequest,
  ExamDetailResponse,
  SubjectResponse,
  CourseClassResponse,
} from '../../../../api';

interface ExamGenerateFormProps {
  onExamCreated: (exam: ExamDetailResponse) => void;
  showToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

interface TopicWeightItem {
  id: string;
  topic: string;
  weight: number;
}

export const ExamGenerateForm: React.FC<ExamGenerateFormProps> = ({
  onExamCreated,
  showToast,
}) => {
  // Dependencies from API
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [courseClasses, setCourseClasses] = useState<CourseClassResponse[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form Fields
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(40);

  // Difficulty Percentages (0 - 100)
  const [easyPercent, setEasyPercent] = useState<number>(30);
  const [mediumPercent, setMediumPercent] = useState<number>(50);
  const [hardPercent, setHardPercent] = useState<number>(20);
  const [unclassifiedPercent, setUnclassifiedPercent] = useState<number>(0);

  // Topic weights list
  const [topicWeights, setTopicWeights] = useState<TopicWeightItem[]>([]);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicWeight, setNewTopicWeight] = useState<number>(0.2);

  // Options
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(false);

  // Selected Course Classes (class_ids)
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load subjects and lecturer's course classes
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoadingData(true);
      try {
        const [subs, classes] = await Promise.all([
          examsApi.getAllSubjects(),
          examsApi.getMyCourseClasses(),
        ]);
        if (isMounted) {
          setSubjects(subs);
          setCourseClasses(classes);
          if (subs.length > 0 && subjectId === '') {
            setSubjectId(subs[0].subject_id || '');
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter available classes for selected subject
  const availableClasses = courseClasses.filter((c) => {
    if (!subjectId) return true;
    return !c.subject_id || c.subject_id === Number(subjectId);
  });

  // Calculate difficulty sum
  const difficultySum =
    Number(easyPercent || 0) +
    Number(mediumPercent || 0) +
    Number(hardPercent || 0) +
    Number(unclassifiedPercent || 0);

  // Helper to normalize difficulty to 100%
  const handleNormalizeDifficulty = () => {
    setEasyPercent(30);
    setMediumPercent(50);
    setHardPercent(20);
    setUnclassifiedPercent(0);
  };

  // Add a topic weight
  const handleAddTopicWeight = () => {
    if (!newTopicName.trim()) {
      showToast('Vui lòng nhập tên chủ đề / chương.', 'warning');
      return;
    }
    const cleanName = newTopicName.trim();
    if (topicWeights.some((t) => t.topic.toLowerCase() === cleanName.toLowerCase())) {
      showToast('Chủ đề này đã có trong danh sách trọng số.', 'warning');
      return;
    }

    setTopicWeights((prev) => [
      ...prev,
      {
        id: 'tw_' + Date.now(),
        topic: cleanName,
        weight: Math.max(0, Math.min(1, newTopicWeight)),
      },
    ]);
    setNewTopicName('');
    setNewTopicWeight(0.2);
  };

  // Remove topic weight
  const handleRemoveTopicWeight = (id: string) => {
    setTopicWeights((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle class selection
  const handleToggleClass = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  // Select all / Deselect all classes
  const handleSelectAllClasses = () => {
    if (selectedClassIds.length === availableClasses.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(availableClasses.map((c) => c.course_class_id!).filter(Boolean));
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!subjectId) {
      setFormError('Vui lòng chọn môn học cần tạo đề.');
      return;
    }

    if (!questionCount || questionCount <= 0) {
      setFormError('Số lượng câu hỏi phải lớn hơn 0.');
      return;
    }

    if (difficultySum !== 100) {
      setFormError(
        `Tổng tỉ lệ phân bố độ khó hiện tại là ${difficultySum}%. Vui lòng điều chỉnh để tổng bằng đúng 100% (hoặc nhấn nút Chuẩn hóa).`
      );
      return;
    }

    if (selectedClassIds.length === 0) {
      setFormError('Vui lòng chọn ít nhất một lớp học phần được áp dụng đề thi này.');
      return;
    }

    // Build topic_weights map if any
    let topicWeightsMap: Record<string, number> | undefined = undefined;
    if (topicWeights.length > 0) {
      topicWeightsMap = {};
      topicWeights.forEach((t) => {
        topicWeightsMap![t.topic] = t.weight;
      });
    }

    // Convert percentages (0-100) to double ratios (0.0 - 1.0) according to OpenAPI
    const requestBody: GenerateExamRequest = {
      subject_id: Number(subjectId),
      class_ids: selectedClassIds,
      title: title.trim() || undefined,
      question_count: Number(questionCount),
      difficulty_distribution: {
        easy: Number((easyPercent / 100).toFixed(2)),
        medium: Number((mediumPercent / 100).toFixed(2)),
        hard: Number((hardPercent / 100).toFixed(2)),
        unclassified: Number((unclassifiedPercent / 100).toFixed(2)),
      },
      topic_weights: topicWeightsMap,
      shuffle_options: shuffleOptions,
      include_answer_key: includeAnswerKey,
    };

    setIsSubmitting(true);

    try {
      const createdExam = await examsApi.generateExam(requestBody);
      showToast('Tạo đề thi tự động thành công!', 'success');
      onExamCreated(createdExam);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể tạo đề thi. Vui lòng kiểm tra lại số lượng câu hỏi đã duyệt trong ngân hàng đề.';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSubjectObj = subjects.find((s) => s.subject_id === Number(subjectId));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs">
      {/* Intro Banner */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm">
            Thuật toán bốc tách đề thi tự động từ câu hỏi Đã phê duyệt (APPROVED)
          </p>
          <p className="leading-relaxed">
            Hệ thống bốc ngẫu nhiên câu hỏi đạt chuẩn kiểm định từ ngân hàng câu hỏi theo tỷ lệ độ khó và trọng số chủ đề yêu cầu, đồng thời tự động gán vào danh sách các lớp học phần được chọn.
          </p>
        </div>
      </div>

      {/* Main Grid: Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Basic info & Difficulty & Topic Weights */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Thông tin đề thi */}
          <div className="bg-fb-card rounded-lg shadow-fb-card p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-fb-text flex items-center gap-2 border-b border-fb-divider pb-2.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>1. Thông tin chung của đề thi</span>
            </h3>

            {/* Subject Selector */}
            <div className="space-y-1.5">
              <label className="block font-bold text-fb-text">
                Môn học <span className="text-red-500">*</span>:
              </label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(Number(e.target.value));
                  setSelectedClassIds([]); // Reset class selection on subject change
                }}
                disabled={loadingData || isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-lg bg-fb-input border border-gray-200 dark:border-gray-600 text-fb-text font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                {subjects.length === 0 ? (
                  <option value="">{loadingData ? 'Đang tải môn học...' : 'Chưa có môn học'}</option>
                ) : (
                  subjects.map((sub) => (
                    <option key={sub.subject_id} value={sub.subject_id}>
                      {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Exam Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-fb-text">
                  Tiêu đề đề thi:
                </label>
                <span className="text-gray-400 text-[11px]">(Tùy chọn)</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                placeholder={`Ví dụ: Đề thi Giữa kỳ ${selectedSubjectObj?.name || 'môn học'} - Kỳ 2026.1`}
                className="w-full px-3.5 py-2 rounded-lg bg-fb-input border border-gray-200 dark:border-gray-600 text-fb-text placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-gray-400">
                Nếu để trống, hệ thống sẽ tự động đặt tiêu đề theo chuẩn tên môn và thời gian sinh.
              </p>
            </div>

            {/* Question Count */}
            <div className="space-y-1.5">
              <label className="block font-bold text-fb-text">
                Số lượng câu hỏi trong đề <span className="text-red-500">*</span>:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-32 px-3 py-2 rounded-lg bg-fb-input border border-gray-200 dark:border-gray-600 text-fb-text font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <div className="flex items-center gap-1.5">
                  {[20, 30, 40, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                        questionCount === num
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-fb-input text-fb-text border-fb-divider hover:bg-gray-200'
                      }`}
                    >
                      {num} câu
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Ma trận phân bố độ khó */}
          <div className="bg-fb-card rounded-lg shadow-fb-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-fb-divider pb-2.5">
              <h3 className="text-sm font-bold text-fb-text flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>2. Phân bố ma trận độ khó câu hỏi</span>
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    difficultySum === 100
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  }`}
                >
                  Tổng: {difficultySum}%
                </span>
                {difficultySum !== 100 && (
                  <button
                    type="button"
                    onClick={handleNormalizeDifficulty}
                    className="text-xs text-fb-blue hover:underline cursor-pointer font-semibold"
                  >
                    Chuẩn hóa (30-50-20)
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Easy */}
              <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                <div className="flex justify-between items-center font-bold text-emerald-800 dark:text-emerald-300">
                  <span>Mức độ Dễ (Easy):</span>
                  <span>{easyPercent}% (~{Math.round((questionCount * easyPercent) / 100)} câu)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={easyPercent}
                  onChange={(e) => setEasyPercent(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Medium */}
              <div className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
                <div className="flex justify-between items-center font-bold text-amber-800 dark:text-amber-300">
                  <span>Mức độ Trung bình (Medium):</span>
                  <span>{mediumPercent}% (~{Math.round((questionCount * mediumPercent) / 100)} câu)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={mediumPercent}
                  onChange={(e) => setMediumPercent(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Hard */}
              <div className="p-3.5 rounded-lg bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 space-y-2">
                <div className="flex justify-between items-center font-bold text-red-800 dark:text-red-300">
                  <span>Mức độ Khó (Hard):</span>
                  <span>{hardPercent}% (~{Math.round((questionCount * hardPercent) / 100)} câu)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={hardPercent}
                  onChange={(e) => setHardPercent(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>

              {/* Unclassified */}
              <div className="p-3.5 rounded-lg bg-fb-input border border-fb-divider space-y-2">
                <div className="flex justify-between items-center font-bold text-fb-text">
                  <span>Chưa phân loại (Unclassified):</span>
                  <span>{unclassifiedPercent}% (~{Math.round((questionCount * unclassifiedPercent) / 100)} câu)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={unclassifiedPercent}
                  onChange={(e) => setUnclassifiedPercent(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-full accent-gray-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Trọng số chủ đề (tùy chọn) */}
          <div className="bg-fb-card rounded-lg shadow-fb-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-fb-divider pb-2.5">
              <h3 className="text-sm font-bold text-fb-text flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>3. Trọng số chủ đề / chương (Tùy chọn)</span>
              </h3>
              <span className="text-gray-400 text-[11px]">topic_weights</span>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Nếu bạn muốn ưu tiên số lượng câu hỏi nhiều hơn cho các chương trọng tâm, hãy thêm tên chủ đề và trọng số (0.0 đến 1.0). Nếu bỏ qua, hệ thống sẽ bốc đều theo các chủ đề hiện có.
            </p>

            {/* Existing Topic Weights List */}
            {topicWeights.length > 0 && (
              <div className="space-y-2">
                {topicWeights.map((tw) => (
                  <div
                    key={tw.id}
                    className="p-2.5 rounded-lg bg-fb-input border border-fb-divider flex items-center justify-between gap-3"
                  >
                    <span className="font-semibold text-fb-text truncate">
                      {tw.topic}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 tabular-nums font-bold text-xs">
                        Trọng số: {tw.weight}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTopicWeight(tw.id)}
                        className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        title="Xóa chủ đề này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new topic weight inline */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Tên chủ đề / Chương (Ví dụ: Định thời CPU)"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 rounded-lg bg-fb-input border border-gray-200 dark:border-gray-600 text-fb-text placeholder-gray-400 focus:outline-hidden"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={newTopicWeight}
                  onChange={(e) => setNewTopicWeight(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-24 px-3 py-2 rounded-lg bg-fb-input border border-gray-200 dark:border-gray-600 text-fb-text tabular-nums text-center focus:outline-hidden"
                  placeholder="0.2"
                />
                <button
                  type="button"
                  onClick={handleAddTopicWeight}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 rounded-lg bg-fb-blue hover:bg-fb-blue-hover text-white font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Classes & Options & Submit */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 4: Lớp học phần áp dụng (Bắt buộc) */}
          <div className="bg-fb-card rounded-lg shadow-fb-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-fb-divider pb-2.5">
              <h3 className="text-sm font-bold text-fb-text flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>4. Lớp học phần áp dụng <span className="text-red-500">*</span></span>
              </h3>
              {availableClasses.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllClasses}
                  className="text-xs text-fb-blue hover:underline font-semibold cursor-pointer"
                >
                  {selectedClassIds.length === availableClasses.length
                    ? 'Bỏ chọn tất cả'
                    : 'Chọn tất cả'}
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-500">
              Chọn các lớp học phần được phân quyền sử dụng đề thi này (chỉ hiển thị lớp do bạn phụ trách).
            </p>

            {availableClasses.length === 0 ? (
              <div className="p-4 rounded-lg bg-fb-input text-center text-gray-500 space-y-2">
                <Users className="w-6 h-6 mx-auto text-gray-400" />
                <p>Không tìm thấy lớp học phần phù hợp môn học này.</p>
                <div className="pt-2">
                  <label className="text-[11px] text-gray-400 block mb-1">
                    Hoặc nhập mã ID lớp thủ công:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Ví dụ: 101"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = Number((e.target as HTMLInputElement).value);
                          if (val && !selectedClassIds.includes(val)) {
                            setSelectedClassIds((prev) => [...prev, val]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#3A3B3C] border text-xs flex-1"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableClasses.map((cls) => {
                  const id = cls.course_class_id!;
                  const isChecked = selectedClassIds.includes(id);

                  return (
                    <label
                      key={id}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30'
                          : 'border-fb-divider/80 hover:bg-fb-hover'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleClass(id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="truncate">
                          <span className="font-bold text-fb-text block truncate">
                            {cls.class_code ? `Lớp ${cls.class_code}` : `Lớp #${id}`}
                          </span>
                          <span className="text-[10px] text-gray-500 block truncate">
                            {cls.semester_name || 'Học kỳ hiện tại'} · {cls.total_students ?? 0} sinh viên
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] tabular-nums text-gray-400 bg-fb-input px-2 py-0.5 rounded-md shrink-0">
                        ID: {id}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
              Đã chọn: {selectedClassIds.length} lớp học phần
            </div>
          </div>

          {/* Section 5: Tùy chọn xáo trộn & đáp án */}
          <div className="bg-fb-card rounded-lg shadow-fb-card p-5 sm:p-6 space-y-3">
            <h3 className="text-sm font-bold text-fb-text flex items-center gap-2 border-b border-fb-divider pb-2.5">
              <Shuffle className="w-4 h-4 text-blue-600" />
              <span>5. Thiết lập đề thi</span>
            </h3>

            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-fb-hover transition">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-fb-text block">
                  Xáo trộn thứ tự các phương án lựa chọn A, B, C, D
                </span>
                <span className="text-[11px] text-gray-500">
                  shuffle_options: Đảo vị trí ngẫu nhiên để chống gian lận trong phòng thi.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-fb-hover transition">
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-fb-text block">
                  Có kèm bảng đáp án đúng
                </span>
                <span className="text-[11px] text-gray-500">
                  include_answer_key: Trả về khóa đáp án chuẩn kèm theo đề thi.
                </span>
              </div>
            </label>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit Action CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-lg bg-fb-blue hover:bg-fb-blue-hover text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý thuật toán sinh đề thi...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Tạo đề thi tự động ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
