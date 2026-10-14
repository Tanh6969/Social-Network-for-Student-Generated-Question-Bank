import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import {
  Search,
  BookOpen,
  FileText,
  Users,
  Star,
  ChevronRight,
  Filter
} from 'lucide-react';

export const SearchResultsView: React.FC = () => {
  const {
    searchQuery,
    posts,
    questions,
    currentUser,
    setActiveQuizQuestion,
    setViewingUserId,
    setActiveTab
  } = useApp();

  const [filterType, setFilterType] = useState<'ALL' | 'QUESTIONS' | 'POSTS' | 'USERS'>('ALL');

  const qMatch = questions.filter(
    (q) =>
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.chapter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pMatch = posts.filter(
    (p) =>
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subjectTag && p.subjectTag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex flex-col md:flex-row gap-6 lg:gap-8 xl:gap-10 items-start">
      {/* CỘT TRÁI: Bộ lọc tìm kiếm (sticky sát lề trái) */}
      <aside className="w-full md:w-72 shrink-0 space-y-2 select-none md:sticky md:top-18">
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 px-2 mb-3">
          Kết quả tìm kiếm
        </h2>

        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-2 space-y-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
          {[
            { id: 'ALL', label: 'Tất cả kết quả', icon: Filter },
            { id: 'QUESTIONS', label: `Câu hỏi thi (${qMatch.length})`, icon: BookOpen },
            { id: 'POSTS', label: `Bài viết (${pMatch.length})`, icon: FileText }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id as any)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${
                filterType === item.id
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold'
                  : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
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
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500">
            Kết quả tìm kiếm cho từ khóa: <strong className="text-blue-600 font-bold">"{searchQuery}"</strong>
          </p>
        </div>

        {/* Questions list */}
        {(filterType === 'ALL' || filterType === 'QUESTIONS') && qMatch.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 px-2">
              Câu hỏi trong ngân hàng ({qMatch.length})
            </h3>
            {qMatch.map((q) => (
              <div
                key={q.id}
                className="bg-white dark:bg-[#242526] rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-2 shadow-xs"
              >
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-blue-600">{q.subject}</span>
                  <span className="text-gray-500">{q.chapter}</span>
                </div>
                <p className="font-semibold text-xs text-gray-900 dark:text-gray-100">
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
        {(filterType === 'ALL' || filterType === 'POSTS') && pMatch.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 px-2">
              Bài viết trên Bảng tin ({pMatch.length})
            </h3>
            {pMatch.map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-[#242526] rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-2 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <AvatarWithFrame user={post.author} size="sm" />
                  <span className="font-bold text-xs text-gray-900 dark:text-gray-100">
                    {post.author.name}
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300">{post.content}</p>
              </div>
            ))}
          </div>
        )}

        {qMatch.length === 0 && pMatch.length === 0 && (
          <div className="bg-white dark:bg-[#242526] rounded-xl p-12 text-center text-gray-400 border border-gray-200 dark:border-gray-700">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm text-gray-700 dark:text-gray-300">
              Không tìm thấy kết quả phù hợp cho "{searchQuery}"
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Hãy thử kiểm tra lại chính tả hoặc tìm theo tên môn học (Mạng máy tính, CSDL, Giải tích...)
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
