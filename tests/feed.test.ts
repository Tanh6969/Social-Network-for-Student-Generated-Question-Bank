import { describe, expect, it } from 'vitest';
import type { CommentItem, Post } from '../src/features/demo/types';
import {
  appendComment,
  countWords,
  getPostContentIssue,
  limitPostContent,
  MAX_POST_CHARACTERS,
  MAX_POST_WORD_CHARACTERS,
  removeOwnedPost,
  sortFeedPosts,
  updateOwnedPost,
} from '../src/features/feed/postUtils';

const post = (id: string, authorId: string, createdAt: string): Post =>
  ({
    id,
    author: { id: authorId },
    createdAt,
    comments: [],
    commentsCount: 0,
  }) as Post;

const comment = (id: string): CommentItem =>
  ({ id, content: id, replies: [] }) as unknown as CommentItem;

describe('feed interactions', () => {
  it('keeps over-limit words visible for correction and blocks publishing', () => {
    const input = Array.from({ length: 501 }, (_, index) => `từ${index}`).join(
      ' ',
    );
    expect(countWords(input)).toBe(501);
    const result = limitPostContent(input);
    expect(result.content).toBe(input);
    expect(result.issue).toBe('words');
    expect(getPostContentIssue(result.content)).toBe('words');
    expect(getPostContentIssue('  một  hai\n ba  ')).toBeNull();
  });

  it('bounds the final word and reports the reason when a pasted post is too long', () => {
    const firstWords = Array.from({ length: 499 }, () => 'a').join(' ');
    const longFinalWord = 'b'.repeat(MAX_POST_WORD_CHARACTERS + 20);
    const result = limitPostContent(`${firstWords} ${longFinalWord}`);
    expect(result.issue).toBe('wordLength');
    expect(countWords(result.content)).toBe(500);
    expect(result.content.split(' ').at(-1)).toHaveLength(
      MAX_POST_WORD_CHARACTERS,
    );
    expect(getPostContentIssue(result.content)).toBeNull();
    expect(limitPostContent(`${firstWords} b c`).issue).toBe('words');
  });

  it('caps the total length and reports a character overflow', () => {
    const input =
      Array.from({ length: 499 }, () => 'a').join(' ') +
      ' ' +
      'b'.repeat(40) +
      ' '.repeat(MAX_POST_CHARACTERS);
    const result = limitPostContent(input);
    expect(result.issue).toBe('characters');
    expect(Array.from(result.content)).toHaveLength(MAX_POST_CHARACTERS);
    expect(getPostContentIssue(result.content)).toBeNull();
  });

  it('shows own and friends posts first, newest first within each group', () => {
    const posts = [
      post('stranger-new', 'other', '2026-10-16T12:00:00Z'),
      post('friend-old', 'friend', '2026-10-16T09:00:00Z'),
      post('mine', 'me', '2026-10-16T11:00:00Z'),
      post('friend-new', 'friend', '2026-10-16T10:00:00Z'),
    ];
    expect(
      sortFeedPosts(posts, 'me', new Set(['friend'])).map((item) => item.id),
    ).toEqual(['mine', 'friend-new', 'friend-old', 'stranger-new']);
    expect(posts[0].id).toBe('stranger-new');
  });

  it('adds a comment and one-level reply without mutating the prior post', () => {
    const parent = comment('parent');
    const original = {
      ...post('post', 'me', '2026-10-16T11:00:00Z'),
      comments: [parent],
      commentsCount: 1,
    };
    const withReply = appendComment(
      [original],
      'post',
      comment('reply'),
      'parent',
    )[0];
    expect(withReply.comments?.[0].replies?.map((item) => item.id)).toEqual([
      'reply',
    ]);
    expect(withReply.commentsCount).toBe(2);
    expect(original.comments[0].replies).toEqual([]);
    const withComment = appendComment(
      [withReply],
      'post',
      comment('second'),
    )[0];
    expect(withComment.comments?.map((item) => item.id)).toEqual([
      'parent',
      'second',
    ]);
    expect(withComment.commentsCount).toBe(3);
  });

  it('does not create an orphan reply when the parent is missing', () => {
    const original = post('post', 'me', '2026-10-16T11:00:00Z');
    expect(
      appendComment([original], 'post', comment('reply'), 'missing')[0],
    ).toBe(original);
  });

  it('only edits or deletes posts owned by the current user', () => {
    const mine = post('mine', 'me', '2026-10-16T11:00:00Z');
    const someoneElse = post('other', 'other', '2026-10-16T10:00:00Z');
    const updates = {
      content: 'Đã sửa',
      privacy: 'PUBLIC' as const,
      mediaUrls: [],
      type: 'KNOWLEDGE' as const,
    };
    expect(
      updateOwnedPost([mine, someoneElse], 'other', 'me', updates)[1],
    ).toBe(someoneElse);
    expect(
      updateOwnedPost([mine, someoneElse], 'mine', 'me', updates)[0].content,
    ).toBe('Đã sửa');
    expect(removeOwnedPost([mine, someoneElse], 'other', 'me')).toHaveLength(2);
    expect(removeOwnedPost([mine, someoneElse], 'mine', 'me')).toEqual([
      someoneElse,
    ]);
  });
});
