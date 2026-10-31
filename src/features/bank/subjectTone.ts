// Màu nhận diện ổn định cho từng môn học (hash theo tên môn) — dùng cho nhãn môn và icon môn
const SUBJECT_TONES = [
  'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
];

export function getSubjectTone(subject: string): string {
  let hash = 0;
  for (const char of subject) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return SUBJECT_TONES[hash % SUBJECT_TONES.length];
}
