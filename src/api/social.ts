import { api, expectEnvelope, type OpBody, type OpQuery } from './client';
import { multipartBody } from './multipart';

export const socialApi = {
  // ==========================================================================
  // 04. Mạng xã hội - Bài viết (Posts)
  // ==========================================================================

  /**
   * GET /posts/{id}
   */
  async getPost(id: number) {
    const result = await api.GET('/posts/{id}', {
      params: { path: { id } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /posts
   */
  async createPost(body: OpBody<'createPost'>) {
    const result = await api.POST('/posts', { body });
    return expectEnvelope(result).data;
  },

  /**
   * PUT /posts/{id}
   */
  async updatePost(id: number, body: OpBody<'updatePost'>) {
    const result = await api.PUT('/posts/{id}', {
      params: { path: { id } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /**
   * DELETE /posts/{id}
   */
  async deletePost(id: number) {
    const result = await api.DELETE('/posts/{id}', {
      params: { path: { id } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * PUT /posts/{id}/lecturer-notes
   */
  async updateLecturerNote(id: number, body: OpBody<'updateLecturerNote'>) {
    const result = await api.PUT('/posts/{id}/lecturer-notes', {
      params: { path: { id } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /video-posts
   */
  async getVideoPosts(query?: OpQuery<'getVideoPosts'>) {
    const result = await api.GET('/video-posts', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /users/{userId}/posts
   */
  async getUserPosts(userId: number, query?: OpQuery<'getUserPosts'>) {
    const result = await api.GET('/users/{userId}/posts', {
      params: { path: { userId }, query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /posts/me
   */
  async getMyPosts(query?: OpQuery<'getMyPosts'>) {
    const result = await api.GET('/posts/me', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 05. Tương tác - Bình luận (Comments)
  // ==========================================================================

  /**
   * GET /comments
   */
  async getComments(query: OpQuery<'getComments'>) {
    const result = await api.GET('/comments', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /comments
   */
  async createComment(body: OpBody<'createComment'>) {
    const result = await api.POST('/comments', { body });
    return expectEnvelope(result).data;
  },

  /**
   * PUT /comments/{commentId}
   */
  async updateComment(commentId: number, body: OpBody<'updateComment'>) {
    const result = await api.PUT('/comments/{commentId}', {
      params: { path: { commentId } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /**
   * DELETE /comments/{commentId}
   */
  async deleteComment(commentId: number) {
    const result = await api.DELETE('/comments/{commentId}', {
      params: { path: { commentId } },
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 06. Tương tác - Cảm xúc (Reactions)
  // ==========================================================================

  /**
   * POST /react
   */
  async toggleReact(body: OpBody<'toggleReact'>) {
    const result = await api.POST('/react', { body });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 13. Dòng hoạt động (Activity Feed)
  // ==========================================================================

  /**
   * GET /activity-feeds
   */
  async getActivityFeeds(query?: OpQuery<'getActivityFeeds'>) {
    const result = await api.GET('/activity-feeds', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /activity-feeds/new-count
   */
  async getNewFeedCount(query: OpQuery<'getNewFeedCount'>) {
    const result = await api.GET('/activity-feeds/new-count', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 25. Tìm kiếm Toàn văn (Search)
  // ==========================================================================

  /**
   * GET /search
   */
  async search(query: OpQuery<'search'>) {
    const result = await api.GET('/search', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /search/saved
   */
  async getSavedAndTrendingSearches() {
    const result = await api.GET('/search/saved');
    return expectEnvelope(result).data;
  },

  /**
   * POST /search/saved
   */
  async recordConfirmedSearch(body: OpBody<'recordConfirmedSearch'>) {
    const result = await api.POST('/search/saved', { body });
    return expectEnvelope(result).data;
  },

  /**
   * DELETE /search/saved/{id}
   */
  async deleteSavedSearch(id: number) {
    const result = await api.DELETE('/search/saved/{id}', {
      params: { path: { id } },
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 26. Báo cáo & Khiếu nại (Reports)
  // ==========================================================================

  /**
   * POST /report
   */
  async createReport(body: OpBody<'createReport'>) {
    const result = await api.POST('/report', { body });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 27. Tải lên Media (Cloudflare R2)
  // ==========================================================================

  /**
   * POST /medias/presign
   */
  async getPresignedUrls(body: OpBody<'getPresignedUrls'>) {
    const result = await api.POST('/medias/presign', { body });
    return expectEnvelope(result).data;
  },

  /**
   * POST /medias/upload
   */
  async uploadMedia(query: OpQuery<'uploadMedia'>, body: OpBody<'uploadMedia'>) {
    const result = await api.POST('/medias/upload', {
      params: { query },
      body,
      bodySerializer: multipartBody,
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /medias/verify
   */
  async verifyMedias(body: OpBody<'verifyMedias'>) {
    const result = await api.POST('/medias/verify', { body });
    return expectEnvelope(result).data;
  },
};
