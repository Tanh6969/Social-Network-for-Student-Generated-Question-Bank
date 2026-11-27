import { describe, expect, it } from 'vitest';
import {
  describeBankGroups,
  groupByBank,
  unclassifiedBasketItems,
  type BasketItem,
} from '../src/features/lecturer/components/ReviewBasketBar';
import { isClassifiedDifficulty } from '../src/features/proposals/difficulty';

const item = (id: number, topic?: string, difficulty?: string): BasketItem => ({
  question_id: id,
  content: `Câu ${id}`,
  session_id: id * 10,
  session_title: `Bộ ${id}`,
  topic,
  difficulty,
});

describe('giỏ câu hỏi: ngân hàng đích theo môn của bộ câu hỏi', () => {
  it('nhóm câu theo môn, giữ thứ tự xuất hiện', () => {
    const groups = groupByBank([
      item(1, 'Hệ điều hành'),
      item(2, 'Cấu trúc dữ liệu và giải thuật'),
      item(3, 'Hệ điều hành'),
      item(4),
    ]);
    expect(
      groups.map((g) => [g.bank, g.items.map((i) => i.question_id)]),
    ).toEqual([
      ['Hệ điều hành', [1, 3]],
      ['Cấu trúc dữ liệu và giải thuật', [2]],
      ['Môn chưa xác định', [4]],
    ]);
  });

  it('câu thông báo ghi rõ số câu vào từng ngân hàng', () => {
    const summary = describeBankGroups(
      groupByBank([
        item(1, 'Hệ điều hành'),
        item(2, 'Hệ điều hành'),
        item(3, 'Cơ sở dữ liệu'),
      ]),
    );
    expect(summary).toBe(
      '2 câu vào ngân hàng đề Hệ điều hành, 1 câu vào Cơ sở dữ liệu',
    );
  });

  it('kiểm tra bắt buộc phân loại độ khó trước khi chọn câu vào ngân hàng đề', () => {
    expect(isClassifiedDifficulty(undefined)).toBe(false);
    expect(isClassifiedDifficulty('UNCLASSIFIED')).toBe(false);
    expect(isClassifiedDifficulty('easy')).toBe(true);
    expect(isClassifiedDifficulty('MEDIUM')).toBe(true);
    expect(isClassifiedDifficulty('HARD')).toBe(true);

    const pending = unclassifiedBasketItems([
      item(1, 'Môn A', 'EASY'),
      item(2, 'Môn A', 'UNCLASSIFIED'),
      item(3, 'Môn A'),
      item(4, 'Môn A', 'HARD'),
    ]);
    expect(pending.map((i) => i.question_id)).toEqual([2, 3]);
  });
});
