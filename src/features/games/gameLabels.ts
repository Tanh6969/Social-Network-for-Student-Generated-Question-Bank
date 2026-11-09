import type { GamePredictionResponse } from '../../api/games';

type GameType = NonNullable<GamePredictionResponse['game_type']>;

/** Tên 6 trò chơi theo enum game_type của Swagger. */
export const GAME_LABELS: Record<GameType, string> = {
  GAME_1_PARTICIPANTS: 'Game 1 · Số sinh viên nộp câu hỏi ngày mai',
  GAME_2_APPROVED_QUESTIONS: 'Game 2 · Số câu được chọn vào ngân hàng đề',
  GAME_3_AUTHOR_CONFIDENCE: 'Game 3 · Mức tự tin của tác giả',
  GAME_4_SUBJECT_BANK_SIZE: 'Game 4 · Quy mô ngân hàng đề cuối kỳ',
  GAME_5_REPORT_ERROR: 'Game 5 · Báo lỗi câu hỏi',
  GAME_6_LLM_IDENTIFICATION: 'Game 6 · Nhận diện câu hỏi do AI tạo',
};

const FIELD_LABELS: Record<string, string> = {
  predicted_count: 'Dự đoán',
  predicted_llm_count: 'Câu AI được chọn',
  predicted_human_count: 'Câu tự làm được chọn',
  predicted_bank_size: 'Quy mô dự đoán',
  selected_llm_question_ids: 'Số câu chọn là AI',
  confidence: 'Mức tự tin',
  actual_count: 'Thực tế',
  avg_rating: 'Đánh giá trung bình',
  correct_count: 'Số câu đúng',
  total: 'Tổng số câu',
};

/**
 * Hiển thị prediction_data / actual_data (Swagger mô tả là object tự do) thành
 * chuỗi dễ đọc; trường lạ vẫn hiện nguyên tên để không mất thông tin.
 */
export function describeData(data: unknown): string {
  if (!data || typeof data !== 'object') return '—';
  const parts = Object.entries(data as Record<string, unknown>).map(
    ([key, value]) => {
      const label = FIELD_LABELS[key] ?? key;
      const shown = Array.isArray(value) ? value.length : String(value);
      return `${label}: ${shown}`;
    },
  );
  return parts.length ? parts.join(' · ') : '—';
}

/** Lượt dự đoán gần nhất của một trò chơi cho một đối tượng (lớp/phiên/môn). */
export function findPrediction(
  predictions: GamePredictionResponse[],
  gameType: GameType,
  targetId: number | undefined,
): GamePredictionResponse | undefined {
  return predictions.find(
    (p) => p.game_type === gameType && p.target_id === targetId,
  );
}
