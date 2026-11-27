export type QuestionDifficultyValue =
  | 'UNCLASSIFIED'
  | 'EASY'
  | 'MEDIUM'
  | 'HARD';

export const QUESTION_DIFFICULTY_OPTIONS: {
  value: QuestionDifficultyValue;
  label: string;
}[] = [
  { value: 'UNCLASSIFIED', label: 'Chưa phân loại' },
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
];

export function normalizeDifficulty(
  value?: string | null,
): QuestionDifficultyValue {
  const upper = value?.trim().toUpperCase();
  if (upper === 'EASY' || upper === 'MEDIUM' || upper === 'HARD') return upper;
  return 'UNCLASSIFIED';
}

export function isClassifiedDifficulty(value?: string | null): boolean {
  return normalizeDifficulty(value) !== 'UNCLASSIFIED';
}

export function difficultyLabel(value?: string | null): string {
  const normalized = normalizeDifficulty(value);
  return (
    QUESTION_DIFFICULTY_OPTIONS.find((o) => o.value === normalized)?.label ??
    'Chưa phân loại'
  );
}

export function difficultyBadgeClasses(value?: string | null): string {
  switch (normalizeDifficulty(value)) {
    case 'EASY':
      return 'bg-fb-success-soft text-fb-success border-fb-success/30';
    case 'MEDIUM':
      return 'bg-fb-warning-soft text-fb-warning border-fb-warning/30';
    case 'HARD':
      return 'bg-fb-danger-soft text-fb-danger border-fb-danger/30';
    default:
      return 'bg-fb-input text-fb-text-2 border-fb-divider';
  }
}
