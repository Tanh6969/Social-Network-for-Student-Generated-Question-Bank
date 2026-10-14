import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import {
  X,
  Image,
  Video,
  Globe,
  Lock,
  Users,
  Paperclip,
  Smile,
  Tag,
  Send
} from 'lucide-react';
import { PostType } from '../../demo/types';

export const CreatePostModal: React.FC = () => {
  const {
    isCreatePostModalOpen,
    setIsCreatePostModalOpen,
    currentUser,
    createPost,
    showToast
  } = useApp();

  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('KNOWLEDGE');
  const [subjectTag, setSubjectTag] = useState('Mạng máy tính');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'FRIENDS' | 'ONLY_ME'>('PUBLIC');
  const [hasMedia, setHasMedia] = useState(false);

  if (!isCreatePostModalOpen) return null;

  const handlePost = () => {
    if (!content.trim()) return;

    createPost({
      content,
      type: postType,
      subjectTag,
      privacy,
      mediaUrls: hasMedia
        ? ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80']
        : undefined
    });

    setIsCreatePostModalOpen(false);
    setContent('');
    setHasMedia(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between text-center relative">
          <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 flex-1">
            Tạo bài viết mới (SOC.02)
          </h3>
          <button
            onClick={() => setIsCreatePostModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 absolute right-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Author info & Privacy */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <AvatarWithFrame user={currentUser} size="md" />
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-gray-100">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as any)}
                  className="bg-gray-100 dark:bg-[#3A3B3C] text-[10px] font-semibold text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md border-0"
                >
                  <option value="PUBLIC">🌐 Công khai</option>
                  <option value="FRIENDS">👥 Bạn bè</option>
                  <option value="ONLY_ME">🔒 Chỉ mình tôi</option>
                </select>

                <select
                  value={subjectTag}
                  onChange={(e) => setSubjectTag(e.target.value)}
                  className="bg-blue-50 dark:bg-blue-950 text-[10px] font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border-0"
                >
                  <option value="Mạng máy tính">Mạng máy tính</option>
                  <option value="Cấu trúc dữ liệu & Giải thuật">Cấu trúc dữ liệu</option>
                  <option value="Cơ sở dữ liệu">Cơ sở dữ liệu</option>
                  <option value="Giải tích 1">Giải tích 1</option>
                </select>
              </div>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            rows={5}
            placeholder={`${currentUser.name.split(' ').slice(-1)[0]} ơi, bạn muốn chia sẻ kiến thức hoặc hỏi đáp gì?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden resize-none leading-relaxed"
          />

          {/* Media preview if attached */}
          {hasMedia && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80"
                alt="Upload preview"
                className="w-full h-40 object-cover"
              />
              <button
                onClick={() => setHasMedia(false)}
                className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Add to your post bar */}
          <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Thêm vào bài viết của bạn:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setHasMedia(!hasMedia);
                  showToast('Đã đính kèm hình ảnh tài liệu', 'info');
                }}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] ${
                  hasMedia ? 'text-emerald-600 bg-emerald-50' : 'text-emerald-500'
                }`}
                title="Đính kèm ảnh/tài liệu"
              >
                <Image className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setPostType('VIDEO');
                  showToast('Đã chọn định dạng Video học tập', 'info');
                }}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] ${
                  postType === 'VIDEO' ? 'text-rose-600 bg-rose-50' : 'text-rose-500'
                }`}
                title="Video học tập"
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handlePost}
            disabled={!content.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Đăng bài viết
          </button>
        </div>
      </div>
    </div>
  );
};
