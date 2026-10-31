import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { PostContent } from '../../feed/components/PostContent';
import {
  Search,
  BookOpen,
  FileText,
  Users,
  Filter,
} from 'lucide-react';

export const SearchResultsView: React.FC = () => {
  const {
    searchQuery,
    posts,
    questions,
    allUsers,
    currentUser,
    friendStatuses,
    isBlockedEitherWay,
    setActivePostDetail,
    setActiveQuizQuestion,
    setViewingUserId,
    setActiveTab,
  } = useApp();

  const [filterType, setFilterType] = useState<
    'ALL' | 'USERS' | 'QUESTIONS' | 'POSTS'
  >('ALL');

  const uMatch = allUsers.filter(
    (u) =>
      !isBlockedEitherWay(u.id) &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.classOrTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.faculty.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const qMatch = questions.filter(
    (q) =>
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.chapter.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const pMatch = posts.filter(
    (p) =>
      !isBlockedEitherWay(p.author.id) &&
      (p.author.id === currentUser.id ||
        p.privacy === 'PUBLIC' ||
        (p.privacy === 'FRIENDS' &&
          friendStatuses[p.author.id] === 'FRIEND')) &&
      (p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Boolean(p.subjectTag?.toLowerCase().includes(searchQuery.toLowerCase()))),
  );

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex flex-col md:flex-row gap-6 lg:gap-8 xl:gap-10 items-start">
      {/* CỘT TRÁI: Bộ lọc tìm kiếm (sticky sát lề trái) */}
      <aside className="w-full md:w-72 shrink-0 space-y-2 select-none md:sticky md:top-18">
        <h2 className="text-xl font-black text-fb-text px-2 mb-3">
          Kết quả tìm kiếm
        </h2>

        <div className="bg-fb-card rounded-lg shadow-fb-card p-2 space-y-1 text-xs font-semibold text-fb-text">
          {[
            { id: 'ALL', label: 'Tất cả kết quả', icon: Filter },
            {
              id: 'USERS',
              label: `Mọi người (${uMatch.length})`,
              icon: Users,
            },
            {
              id: 'QUESTIONS',
              label: `Câu hỏi thi (${qMatch.length})`,
              icon: BookOpen,
            },
            {
              id: 'POSTS',
              label: `Bài viết (${pMatch.length})`,
              icon: FileText,
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id as typeof filterType)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${
                filterType === item.id
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold'
                  : 'hover:bg-fb-hover'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* CỘT PHẢI: Kết quả tìm kiếm */}
      <main className="flex-1 space-y-4">
        <div className="bg-fb-card rounded-lg shadow-fb-card p-4">
          <p className="text-xs text-gray-500">
            Kết quả tìm kiếm cho từ khóa:{' '}
            <strong className="text-blue-600 font-bold">"{searchQuery}"</strong>
          </p>
        </div>

        {/* Users list */}
        {(filterType === 'ALL' || filterType === 'USERS') &&
          uMatch.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-gray-500 px-2">
                Mọi người ({uMatch.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uMatch.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setViewingUserId(u.id);
                      setActiveTab('profile');
                    }}
                    className="bg-fb-card rounded-lg p-3 border border-fb-divider flex items-center justify-between gap-3 cursor-pointer hover:bg-fb-hover"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarWithFrame user={u} size="md" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-fb-text truncate">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {u.classOrTitle} · {u.faculty}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 shrink-0">
                      Xem hồ sơ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Questions list */}
        {(filterType === 'ALL' || filterType === 'QUESTIONS') &&
          qMatch.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-gray-500 px-2">
                Câu hỏi trong ngân hàng ({qMatch.length})
              </h3>
              {qMatch.map((q) => (
                <div
                  key={q.id}
                  className="bg-fb-card rounded-lg p-4 space-y-2 shadow-fb-card"
                >
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-blue-600">{q.subject}</span>
                    <span className="text-gray-500">{q.chapter}</span>
                  </div>
                  <p className="font-semibold text-xs text-fb-text">
                    {q.content}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setActiveQuizQuestion(q)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
                    >
                      Làm thử câu này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Posts list */}
        {(filterType === 'ALL' || filterType === 'POSTS') &&
          pMatch.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-gray-500 px-2">
                Bài viết trên Bảng tin ({pMatch.length})
              </h3>
              {pMatch.map((post) => (
                <div
                  key={post.id}
                  className="bg-fb-card rounded-lg p-4 space-y-2 shadow-fb-card"
                >
                  <div className="flex items-center gap-2">
                    <AvatarWithFrame user={post.author} size="sm" />
                    <span className="font-bold text-xs text-fb-text">
                      {post.author.name}
                    </span>
                  </div>
                  <PostContent key={post.id} content={post.content} compact />
                  <button
                    onClick={() => setActivePostDetail(post)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Xem chi tiết và bình luận
                  </button>
                </div>
              ))}
            </div>
          )}

        {uMatch.length === 0 && qMatch.length === 0 && pMatch.length === 0 && (
          <div className="bg-fb-card rounded-lg p-12 text-center text-gray-400 border border-fb-divider">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm text-fb-text">
              Không tìm thấy kết quả phù hợp cho "{searchQuery}"
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Hãy thử kiểm tra lại chính tả hoặc tìm theo tên môn học (Mạng máy
              tính, CSDL, Giải tích...)
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
