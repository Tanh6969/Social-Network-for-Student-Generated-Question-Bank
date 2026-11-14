import { useEffect, useState } from 'react';
import { errorMessage, examsApi, type ClassStudentResponse, type SubjectResponse } from '../../../api';
import { courseClassesApi, type CourseClassResponse } from '../../../api/courseClasses';
import { SkeletonRows } from '../../../shared/components/Skeleton';

export function LecturerClassesView() {
  const [mine, setMine] = useState<CourseClassResponse[]>([]);
  const [all, setAll] = useState<CourseClassResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [lecturerCount, setLecturerCount] = useState(0);
  const [selected, setSelected] = useState<CourseClassResponse | null>(null);
  const [students, setStudents] = useState<ClassStudentResponse[]>([]);
  const [classCode, setClassCode] = useState('');
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [studentCodes, setStudentCodes] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const reload = async () => {
    const [own, classes, subjectList, lecturers] = await Promise.all([
      examsApi.getMyCourseClasses(), courseClassesApi.listAll(),
      examsApi.getAllSubjects(), courseClassesApi.getLecturers(),
    ]);
    setMine(own); setAll(classes); setSubjects(subjectList); setLecturerCount(lecturers.length);
  };
  useEffect(() => {
    let cancelled = false;
    void reload().catch((cause: unknown) => {
      if (!cancelled) setError(errorMessage(cause, 'Không tải được lớp học phần.'));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const openClass = async (id?: number) => {
    if (id == null) return;
    setError(null);
    try {
      const [detail, members] = await Promise.all([
        courseClassesApi.getDetail(id), examsApi.getClassStudents({ course_class_id: id }),
      ]);
      setSelected(detail); setStudents(members);
    } catch (cause: unknown) { setError(errorMessage(cause, 'Không tải được chi tiết lớp.')); }
  };
  const createClass = async () => {
    if (!classCode.trim() || !subjectId || busy) return;
    setBusy(true); setError(null);
    try {
      const created = await courseClassesApi.create(classCode.trim(), subjectId);
      await reload(); setClassCode('');
      if (created?.course_class_id != null) await openClass(created.course_class_id);
      setResult('Đã tạo lớp học phần.');
    } catch (cause: unknown) { setError(errorMessage(cause, 'Không tạo được lớp.')); }
    finally { setBusy(false); }
  };
  const assign = async () => {
    const codes = [...new Set(studentCodes.split(/[\s,;]+/u).map((code) => code.trim()).filter(Boolean))];
    if (!selected?.course_class_id || !codes.length || busy) return;
    setBusy(true); setError(null);
    try {
      const response = await courseClassesApi.assignStudents(selected.course_class_id, codes);
      await openClass(selected.course_class_id); setStudentCodes('');
      setResult(`Đã thêm ${response?.total_enrolled ?? 0} sinh viên; ${response?.not_found_count ?? 0} mã không tìm thấy.`);
    } catch (cause: unknown) { setError(errorMessage(cause, 'Không thêm được sinh viên.')); }
    finally { setBusy(false); }
  };

  return <main className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:px-6">
    <h1 className="text-xl font-bold text-fb-text">Lớp học phần</h1>
    {error && <p role="alert" className="rounded-lg bg-fb-card p-3 text-sm text-fb-danger">{error}</p>}
    {result && <p role="status" className="rounded-lg bg-fb-card p-3 text-sm text-fb-blue">{result}</p>}
    {loading ? <SkeletonRows count={3} label="Đang tải lớp học phần…" /> : <>
      <section className="grid gap-4 lg:grid-cols-2">
        {[{ title: 'Lớp tôi phụ trách', list: mine }, { title: `Tất cả lớp · ${lecturerCount} giảng viên`, list: all }].map((group) =>
          <div key={group.title} className="rounded-lg bg-fb-card p-4 shadow-fb-card">
            <h2 className="mb-3 font-bold text-fb-text">{group.title} ({group.list.length})</h2>
            {group.list.length === 0 && <p className="text-sm text-fb-text-2">Chưa có lớp.</p>}
            {group.list.map((item) => <button key={item.course_class_id} type="button" onClick={() => void openClass(item.course_class_id)}
              className="block w-full border-t border-fb-divider py-2 text-left text-sm text-fb-text hover:text-fb-blue">
              {item.class_code} · {item.subject_name} · {item.lecturer_name}
            </button>)}
          </div>)}
      </section>
      <section className="rounded-lg bg-fb-card p-4 shadow-fb-card"><h2 className="mb-3 font-bold text-fb-text">Tạo lớp học phần</h2>
        <div className="flex flex-wrap gap-2">
          <input aria-label="Mã lớp học phần" placeholder="Mã lớp" value={classCode} onChange={(event) => setClassCode(event.target.value)}
            className="rounded-lg border border-fb-divider bg-fb-input p-2 text-sm text-fb-text" />
          <select aria-label="Môn học" value={subjectId ?? ''} onChange={(event) => setSubjectId(Number(event.target.value) || null)}
            className="rounded-lg border border-fb-divider bg-fb-input p-2 text-sm text-fb-text">
            <option value="">Chọn môn học</option>
            {subjects.filter((subject) => subject.subject_id != null).map((subject) =>
              <option key={subject.subject_id} value={subject.subject_id}>{subject.name}</option>)}
          </select>
          <button type="button" disabled={busy || !classCode.trim() || !subjectId} onClick={() => void createClass()}
            className="rounded-lg bg-fb-blue px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Tạo lớp</button>
        </div>
      </section>
      {selected && <section className="rounded-lg bg-fb-card p-4 shadow-fb-card">
        <h2 className="font-bold text-fb-text">{selected.class_code} · {selected.subject_name}</h2>
        <p className="text-sm text-fb-text-2">{selected.semester_name} · {selected.lecturer_name} · {selected.total_students ?? 0} sinh viên</p>
        <div className="mt-3 space-y-1">{students.map((student) => <p key={student.user_id} className="border-t border-fb-divider py-1 text-sm text-fb-text">{student.student_code} · {student.full_name}</p>)}</div>
        <label className="mt-4 block text-sm text-fb-text">Thêm sinh viên bằng mã số (ngăn cách bởi dấu phẩy hoặc xuống dòng)
          <textarea value={studentCodes} onChange={(event) => setStudentCodes(event.target.value)} rows={3}
            className="mt-1 block w-full rounded-lg border border-fb-divider bg-fb-input p-2" />
        </label>
        <button type="button" disabled={busy || !studentCodes.trim()} onClick={() => void assign()}
          className="mt-2 rounded-lg bg-fb-blue px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Thêm vào lớp</button>
      </section>}
    </>}
  </main>;
}
