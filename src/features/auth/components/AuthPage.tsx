import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Trophy,
  MessageCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, loginWithCredentials, showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!email.trim() || !password) {
      showToast('Vui lòng nhập đầy đủ Email trường và Mật khẩu', 'warning');
      return;
    }
    setLoginError('');
    setIsSubmitting(true);
    try {
      await loginWithCredentials(email, password);
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : 'Đăng nhập thất bại.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStudentLogin = () => {
    login('STUDENT');
  };

  const handleQuickLecturerLogin = () => {
    login('LECTURER');
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#18191A] text-gray-900 dark:text-gray-100 flex flex-col justify-between selection:bg-blue-200">
      <div className="max-w-[1240px] w-full mx-auto px-4 py-8 sm:py-16 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* ================= CỘT TRÁI (55%): BRAND HERO FACEBOOK STYLE ================= */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md">
                <span className="font-black text-3xl tracking-tighter">U</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                UniSocial
              </h1>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
              Học cùng bạn bè, đóng góp cùng thầy cô.
            </h2>

            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
              Mạng xã hội học tập kết hợp Ngân hàng đề thi Đại học chuẩn hóa.
              Sinh viên đề xuất câu hỏi thi, Giảng viên kiểm duyệt và cùng tham
              gia các minigame dự đoán sôi nổi.
            </p>

            {/* Academic Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0 pt-2 text-xs text-gray-700 dark:text-gray-300">
              <div className="p-3 bg-white dark:bg-[#242526] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold">
                  Ngân hàng đề thi chuẩn Quốc gia
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-[#242526] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  Hội đồng Giảng viên phê duyệt
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-[#242526] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-semibold">
                  Minigame & Bảng vàng cống hiến
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-[#242526] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold">
                  Messenger realtime & Khung avatar
                </span>
              </div>
            </div>
          </div>

          {/* ================= CỘT PHẢI (45%): FORM CARD ĐĂNG NHẬP / ĐĂNG KÝ ================= */}
          <div className="lg:col-span-6 max-w-md w-full mx-auto">
            <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 space-y-5">
              {/* MÀN 1: ĐĂNG NHẬP (AUTH.01) */}
              <div className="space-y-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Đăng nhập tài khoản trường
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Sử dụng email và mật khẩu tài khoản đại học của bạn
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Email tài khoản
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="nam.nh2054@truong.edu.vn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-[#3A3B3C] border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Mật khẩu
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          showToast(
                            'Vui lòng liên hệ quản trị viên để đặt lại mật khẩu.',
                            'info',
                          )
                        }
                        className="text-[11px] text-blue-600 hover:underline"
                      >
                        Cần đặt lại mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 bg-gray-50 dark:bg-[#3A3B3C] border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <p role="alert" className="text-xs text-red-600">
                      {loginError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </button>
                </form>

                <div className="relative flex py-1 items-center">
                  <div className="grow border-t border-gray-200 dark:border-gray-700"></div>
                  <span className="shrink mx-4 text-gray-400 text-xs uppercase font-semibold">
                    hoặc
                  </span>
                  <div className="grow border-t border-gray-200 dark:border-gray-700"></div>
                </div>

                <div className="text-center text-xs text-gray-500">
                  Tài khoản được quản trị viên cấp sẵn.
                </div>

                {/* Quick demo buttons */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 block text-center uppercase tracking-wider">
                    Đăng nhập nhanh dùng thử (Demo):
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleQuickStudentLogin}
                      disabled={isSubmitting}
                      className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition text-center"
                    >
                      👨‍🎓 Sinh viên (Nam)
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickLecturerLogin}
                      disabled={isSubmitting}
                      className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition text-center"
                    >
                      👨‍🏫 Giảng viên (TS. Đức)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500">
        <p>
          © 2026 UniSocial & ExamBank Đại học. Nền tảng Mạng xã hội học tập &
          Ngân hàng đề thi chuẩn Quốc gia.
        </p>
      </footer>
    </div>
  );
};
