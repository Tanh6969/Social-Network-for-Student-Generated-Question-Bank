import { describe, expect, it } from 'vitest';
import {
  describeBankGroups,
  groupByBank,
  type BasketItem,
} from '../src/features/lecturer/components/ReviewBasketBar';

const item = (id: number, topic?: string): BasketItem => ({
  question_id: id,
  content: `Câu ${id}`,
  session_id: id * 10,
  session_title: `Bộ ${id}`,
  topic,
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
});
