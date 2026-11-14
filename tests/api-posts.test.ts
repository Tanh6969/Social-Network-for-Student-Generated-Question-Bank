import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStore } from '../src/api/token';
import type { User } from '../src/features/demo/types';

// Máy chủ thật trả code "1000" (Swagger ghi "0000"): test dùng mã thật.
const envelope = (
  data: unknown,
  status = 200,
  code = '1000',
  message = 'SUCCESS',
) =>
  new Response(JSON.stringify({ code, message, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const me = {
  id: '144',
  name: 'Nguyễn Tuấn Anh',
  role: 'STUDENT',
  avatar: 'me.png',
} as User;

type Handler = (method: string, url: URL, body: unknown) => Response;
let respond: Handler;
const requests: { method: string; path: string; body: unknown }[] = [];

async function load() {
  const posts = await import('../src/api/posts');
  const feed = await import('../src/features/feed/apiPosts');
  return { postsApi: posts.postsApi, feed };
}

beforeEach(() => {
  requests.length = 0;
  tokenStore.set('token');
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost/api/v1');
  vi.resetModules();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      const url = new URL(input.url);
      const type = input.headers.get('Content-Type') ?? '';
      const body = type.includes('json')
        ? await input.json()
        : type.includes('multipart')
          ? 'multipart'
          : null;
      requests.push({
        method: input.method,
        path: url.pathname + url.search,
        body,
      });
      return respond(input.method, url, body);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  tokenStore.set(null);
});

describe('API envelope', () => {
  it('chấp nhận cả mã thành công "1000" của máy chủ thật và "0000" của Swagger', async () => {
    const { postsApi } = await load();
    respond = () => envelope({ post_id: 1 });
    await expect(postsApi.getPost(1)).resolves.toMatchObject({ post_id: 1 });
    respond = () => envelope({ post_id: 2 }, 200, '0000');
    await expect(postsApi.getPost(2)).resolves.toMatchObject({ post_id: 2 });
    respond = () => envelope(null, 404, '2001', 'POST_NOT_FOUND');
    await expect(postsApi.getPost(3)).rejects.toThrow('POST_NOT_FOUND');
  });
});

describe('ghi dữ liệu theo Swagger', () => {
  it('sửa và xóa bình luận của chính mình qua đúng endpoint', async () => {
    respond = (method, url) => {
      if (method === 'PUT' && url.pathname.endsWith('/comments/42'))
        return envelope({ comment_id: 42, content: 'Đã sửa' });
      if (method === 'DELETE' && url.pathname.endsWith('/comments/42'))
        return envelope({ comment_id: 42 });
      return envelope(null, 404, '2001', 'NOT_FOUND');
    };
    const { postsApi } = await load();
    await expect(postsApi.updateComment(42, 'Đã sửa')).resolves.toMatchObject({ content: 'Đã sửa' });
    await expect(postsApi.deleteComment(42)).resolves.toBeUndefined();
    expect(requests.map((item) => [item.method, item.path, item.body])).toEqual([
      ['PUT', '/api/v1/comments/42', { content: 'Đã sửa' }],
      ['DELETE', '/api/v1/comments/42', null],
    ]);
  });

  it('chỉnh hồ sơ chỉ gửi các trường được backend chấp nhận', async () => {
    respond = () => envelope({ user_id: 144, full_name: 'Tên mới', bio: 'Tiểu sử' });
    const { postsApi } = await load();
    await postsApi.updateMyProfile({ full_name: 'Tên mới', bio: 'Tiểu sử' });
    expect(requests[0]).toMatchObject({
      method: 'PUT', path: '/api/v1/users/me',
      body: { full_name: 'Tên mới', bio: 'Tiểu sử' },
    });
  });

  it('bài viết trang cá nhân dùng cursor riêng của người đó', async () => {
    respond = () => envelope({
      items: [{ post_id: 9, author: { user_id: 7 } }],
      pagination: { has_next: true, after: 9 },
    });
    const { postsApi } = await load();
    await expect(postsApi.getUserPosts(7, 12)).resolves.toMatchObject({
      items: [{ post_id: 9 }], hasNext: true, after: 9,
    });
    expect(requests[0].path).toBe('/api/v1/users/7/posts?after=12&limit=20');
  });

  it('gửi báo cáo thật đến đúng đối tượng và loại vi phạm', async () => {
    respond = () => envelope({ report_id: 17 });
    const { reportsApi } = await import('../src/api/reports');
    await reportsApi.createReport({
      target_type: 'POST', target_id: 42, violation_type: 'SPAM',
      description: 'Quảng cáo lặp lại',
    });
    expect(requests[0]).toMatchObject({ method: 'POST', path: '/api/v1/report',
      body: { target_type: 'POST', target_id: 42,
        violation_type: 'SPAM', description: 'Quảng cáo lặp lại' } });
  });
});

describe('phân trang bảng tin từ backend', () => {
  it('dùng cursor riêng cho activity, bài cá nhân và tìm kiếm công khai', async () => {
    respond = (_method, url) => {
      const after = url.searchParams.get('after');
      if (url.pathname.endsWith('/activity-feeds')) return envelope({
        items: after ? [{ feed_id: 2, target_type: 'POST', target_id: 22 }] :
          [{ feed_id: 1, target_type: 'POST', target_id: 21 }],
        pagination: after ? { has_next: false } : { has_next: true, after: 1 },
      });
      if (url.pathname.endsWith('/posts/me')) return envelope({
        items: after ? [{ post_id: 12, author: { user_id: 144 } }] :
          [{ post_id: 11, author: { user_id: 144 } }],
        pagination: after ? { has_next: false } : { has_next: true, after: 11 },
      });
      if (url.pathname.endsWith('/search')) return envelope({
        items: after ? [{ type: 'POST', post: { post_id: 32 } }] :
          [{ type: 'POST', post: { post_id: 31 } }],
        pagination: after ? { has_next: false } : { has_next: true, after: 10 },
      });
      const id = Number(url.pathname.split('/').pop());
      return envelope({ post_id: id, author: { user_id: 7 }, visibility: 'PUBLIC' });
    };
    const { feed } = await load();
    const first = await feed.loadApiFeedPage(me, feed.initialApiFeedCursor);
    expect(first.posts.map((post) => post.id).sort()).toEqual(['11', '21', '31']);
    expect(first.cursor).toMatchObject({
      activity: { after: 1, hasNext: true },
      mine: { after: 11, hasNext: true },
      public: { after: 10, hasNext: true },
    });
    const second = await feed.loadApiFeedPage(me, first.cursor);
    expect(second.posts.map((post) => post.id).sort()).toEqual(['12', '22', '32']);
    expect(Object.values(second.cursor).every((source) => !source.hasNext)).toBe(true);
    expect(requests.some((item) => item.path.includes('/search?type=POST&after=10&limit=10'))).toBe(true);
  });
});

describe('ánh xạ bài viết / bảng tin', () => {
  it('bài viết: media tách ảnh và tài liệu, tác giả là mình thì dùng currentUser', async () => {
    const { feed } = await load();
    const post = feed.postFromApi(
      {
        post_id: 9,
        content: 'Xin chào',
        post_type: 'SOCIAL_POST',
        visibility: 'FRIENDS',
        author: { user_id: 144, full_name: 'Tên cũ' },
        media_urls: [
          { url: 'a.png', type: 'IMAGE' },
          { url: 'b.pdf', type: 'DOCUMENT', name: 'b.pdf', size: 10 },
        ],
        react_count: 3,
        reacted_by_me: true,
        comment_count: 2,
        created_at: '2026-11-09T00:00:00Z',
      },
      me,
    );
    expect(post).toMatchObject({
      id: '9',
      author: me,
      type: 'KNOWLEDGE',
      privacy: 'FRIENDS',
      mediaUrls: ['a.png'],
      documents: [{ name: 'b.pdf', url: 'b.pdf', size: 10 }],
      likesCount: 3,
      isLiked: true,
      commentsCount: 2,
      apiTarget: { type: 'POST', id: 9 },
    });
    expect(post.comments).toBeUndefined(); // tải khi mở chi tiết
  });

  it('bảng tin: gộp bài của mình, tải chi tiết bài trong dòng hoạt động, giữ thẻ hoạt động', async () => {
    respond = (_m, url) => {
      if (url.pathname.endsWith('/activity-feeds'))
        return envelope({
          items: [
            {
              feed_id: 1,
              target_type: 'POST',
              target_id: 20,
              action_type: 'CREATED_POST',
              actor: { user_id: 7 },
            },
            {
              feed_id: 2,
              target_type: 'POST',
              target_id: 10,
              action_type: 'CREATED_POST',
              actor: { user_id: 144 },
            },
            {
              feed_id: 3,
              target_type: 'POST',
              target_id: 30,
              action_type: 'CREATED_POST',
              actor: { user_id: 8 },
            },
            {
              feed_id: 4,
              target_type: 'SESSION',
              target_id: 302,
              action_type: 'SESSION_RESOLVED_APPROVED',
              actor: { user_id: 25, full_name: 'Đồng Văn Hiếu' },
              content: {
                title: 'Phiên được duyệt',
                subject_name: 'Web',
                react_count: 2,
                comment_count: 1,
              },
            },
            {
              feed_id: 5,
              target_type: 'BADGE',
              target_id: 1,
              action_type: 'EARNED_BADGE',
              actor: { user_id: 25 },
              content: { title: 'Huy hiệu mới', description: 'Mô tả' },
            },
          ],
          pagination: { has_next: false },
        });
      if (url.pathname.endsWith('/posts/me'))
        return envelope({
          items: [
            { post_id: 10, author: { user_id: 144 }, content: 'Của tôi' },
          ],
        });
      if (url.pathname.endsWith('/posts/20'))
        return envelope({
          post_id: 20,
          author: { user_id: 7, full_name: 'Bạn A' },
          content: 'Bài A',
        });
      return envelope(null, 404, '2001', 'POST_NOT_FOUND'); // bài 30 đã bị xoá
    };
    const { feed } = await load();
    const posts = await feed.loadApiFeed(me);
    expect(posts.map((p) => p.id).sort()).toEqual([
      '10',
      '20',
      'feed-4',
      'feed-5',
    ]);
    // Bài 10 đã có trong /posts/me nên không gọi chi tiết lại.
    expect(requests.some((r) => r.path.endsWith('/posts/10'))).toBe(false);
    const session = posts.find((p) => p.id === 'feed-4')!;
    expect(session).toMatchObject({
      type: 'QUESTION_APPROVED',
      content: 'Phiên được duyệt',
      subjectTag: 'Web',
      likesCount: 2,
      commentsCount: 1,
      apiTarget: { type: 'SESSION', id: 302 },
      isActivity: true,
    });
    expect(posts.find((p) => p.id === 'feed-5')).toMatchObject({
      content: 'Huy hiệu mới\nMô tả',
      apiTarget: undefined,
    });
  });

  it('bình luận: replies lồng nhau, bình luận đã xoá hiện thông báo', async () => {
    const { feed } = await load();
    const comment = feed.commentFromApi(
      {
        comment_id: 1,
        content: 'Gốc',
        author: { user_id: 7, full_name: 'Bạn A' },
        replies: [
          {
            comment_id: 2,
            content: 'x',
            deleted: true,
            author: { user_id: 144 },
          },
        ],
      },
      me,
    );
    expect(comment).toMatchObject({ id: '1', content: 'Gốc' });
    expect(comment.author.name).toBe('Bạn A');
    expect(comment.replies?.[0]).toMatchObject({
      id: '2',
      content: 'Bình luận đã bị xoá.',
      author: me,
    });
  });
});

describe('tải media khi đăng / sửa bài', () => {
  it('chỉ tải tệp mới; media cũ giữ nguyên MediaItem gốc; tài liệu dùng purpose DOCUMENT', async () => {
    respond = (_m, url) =>
      envelope({
        object_key: `k-${url.searchParams.get('purpose')}`,
        url: `https://cdn/${url.searchParams.get('purpose')}`,
        media_type:
          url.searchParams.get('purpose') === 'DOCUMENT' ? 'DOCUMENT' : 'IMAGE',
        file_size: 5,
      });
    const { feed } = await load();
    const image = new File(['img'], 'a.png', { type: 'image/png' });
    const doc = new File(['doc'], 'b.pdf', { type: 'application/pdf' });
    const existing = {
      key: 'old',
      url: 'https://cdn/old.png',
      type: 'IMAGE' as const,
      width: 9,
    };
    const items = await feed.buildMediaItems(
      ['https://cdn/old.png', 'blob:new'],
      [
        {
          name: 'b.pdf',
          url: 'blob:doc',
          size: 3,
          mimeType: 'application/pdf',
        },
      ],
      new Map([
        ['blob:new', image],
        ['blob:doc', doc],
      ]),
      [existing],
    );
    expect(items).toEqual([
      existing,
      expect.objectContaining({
        key: 'k-POST',
        url: 'https://cdn/POST',
        type: 'IMAGE',
        name: 'a.png',
      }),
      expect.objectContaining({
        key: 'k-DOCUMENT',
        type: 'DOCUMENT',
        name: 'b.pdf',
      }),
    ]);
    expect(requests.map((r) => `${r.method} ${r.path} ${r.body}`)).toEqual([
      'POST /api/v1/medias/upload?purpose=POST multipart',
      'POST /api/v1/medias/upload?purpose=DOCUMENT multipart',
    ]);
  });

  it('đăng bài, thả cảm xúc, bình luận gửi đúng body theo Swagger', async () => {
    respond = () => envelope({ post_id: 5 });
    const { postsApi } = await load();
    await postsApi.createPost({
      content: 'Hi',
      visibility: 'PUBLIC',
      post_type: 'SOCIAL_POST',
    });
    await postsApi.react('POST', 5);
    await postsApi.createComment('POST', 5, 'Bình luận', 3);
    await postsApi.getComments('SESSION', 302);
    expect(requests.map((r) => `${r.method} ${r.path}`)).toEqual([
      'POST /api/v1/posts',
      'POST /api/v1/react',
      'POST /api/v1/comments',
      'GET /api/v1/comments?target_type=SESSION&target_id=302&sort=oldest&limit=50',
    ]);
    expect(requests[1].body).toEqual({
      target_type: 'POST',
      target_id: 5,
      reaction_type: 'LIKE',
    });
    expect(requests[2].body).toEqual({
      target_type: 'POST',
      target_id: 5,
      content: 'Bình luận',
      parent_comment_id: 3,
    });
  });
});

describe('bảng tin — bài công khai của mọi người', () => {
  it('gộp bài từ GET /search?type=POST, lấy chi tiết từng bài, bỏ bài không xem được', async () => {
    respond = (_m, url) => {
      if (url.pathname.endsWith('/activity-feeds'))
        return envelope({ items: [], pagination: { has_next: false } });
      if (url.pathname.endsWith('/posts/me'))
        return envelope({
          items: [
            { post_id: 10, author: { user_id: 144 }, content: 'Của tôi' },
          ],
        });
      if (url.pathname.endsWith('/search'))
        return envelope({
          items: [
            {
              type: 'POST',
              post: { post_id: 10, created_at: '2026-11-01T00:00:00Z' },
            },
            {
              type: 'POST',
              post: { post_id: 56, created_at: '2026-10-30T09:01:00Z' },
            },
            {
              type: 'POST',
              post: { post_id: 57, created_at: '2026-10-29T09:01:00Z' },
            },
          ],
          pagination: { has_next: false },
        });
      if (url.pathname.endsWith('/posts/56'))
        return envelope({
          post_id: 56,
          author: { user_id: 25, full_name: 'Đồng Văn Hiếu' },
          content: 'RESTful API',
          visibility: 'PUBLIC',
          react_count: 3,
        });
      // Bài 57: không có quyền xem (chặn / chỉ bạn bè) → backend từ chối.
      return envelope(null, 403, '1009', 'FORBIDDEN');
    };
    const { feed } = await load();
    const posts = await feed.loadApiFeed(me);

    expect(posts.map((p) => p.id).sort()).toEqual(['10', '56']);
    expect(
      requests.find((r) => r.path.startsWith('/api/v1/search'))?.path,
    ).toBe('/api/v1/search?type=POST&limit=50');
    // Bài của mình đã có trong /posts/me thì không tải lại.
    expect(requests.some((r) => r.path.endsWith('/posts/10'))).toBe(false);
    expect(posts.find((p) => p.id === '56')).toMatchObject({
      content: 'RESTful API',
      likesCount: 3,
    });
  });

  it('tìm kiếm lỗi thì bảng tin vẫn hiện như cũ', async () => {
    respond = (_m, url) => {
      if (url.pathname.endsWith('/search'))
        return envelope(null, 500, '5000', 'ES down');
      if (url.pathname.endsWith('/activity-feeds'))
        return envelope({ items: [], pagination: { has_next: false } });
      return envelope({ items: [{ post_id: 10, author: { user_id: 144 } }] });
    };
    const { feed } = await load();
    expect((await feed.loadApiFeed(me)).map((p) => p.id)).toEqual(['10']);
  });
});
