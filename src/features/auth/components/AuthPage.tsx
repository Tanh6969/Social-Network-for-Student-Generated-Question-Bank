import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  ShieldCheck,
  BookOpen,
  Trophy,
  MessageCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  KeyRound,
} from 'lucide-react';
import { mockDemoPassword } from '../../../mocks/mockData';

export const AuthPage: React.FC = () => {
  const { loginWithCredentials, showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!email.trim() || !password) {
      setLoginError('Vui lòng nhập đầy đủ email tài khoản và mật khẩu.');
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
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-fb-canvas text-fb-text flex flex-col justify-between selection:bg-fb-blue/30">
      <div className="max-w-[1240px] w-full mx-auto px-4 py-8 sm:py-16 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* ================= CỘT TRÁI (55%): BRAND HERO FACEBOOK STYLE ================= */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-fb-blue flex items-center justify-center text-white shadow-md">
                <span className="font-bold text-3xl tracking-tighter">U</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-fb-blue tracking-tight">
                UniSocial
              </h1>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-fb-text leading-tight">
              Học cùng bạn bè, đóng góp cùng thầy cô.
            </h2>

            <p className="text-fb-text-2 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
              Mạng xã hội học tập kết hợp Ngân hàng đề thi Đại học chuẩn hóa.
              Sinh viên đề xuất câu hỏi thi, Giảng viên kiểm duyệt và cùng tham
              gia các minigame dự đoán sôi nổi.
            </p>

            {/* Academic Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0 pt-2 text-xs text-fb-text">
              <div className="p-3 bg-fb-card rounded-lg border border-fb-divider shadow-2xs flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-fb-blue shrink-0" />
                <span className="font-semibold">
                  Ngân hàng đề thi chuẩn Quốc gia
                </span>
              </div>

              <div className="p-3 bg-fb-card rounded-lg border border-fb-divider shadow-2xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-fb-success shrink-0" />
                <span className="font-semibold">
                  Hội đồng Giảng viên phê duyệt
                </span>
              </div>

              <div className="p-3 bg-fb-card rounded-lg border border-fb-divider shadow-2xs flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-fb-warning shrink-0" />
                <span className="font-semibold">
                  Minigame & Bảng vàng cống hiến
                </span>
              </div>

              <div className="p-3 bg-fb-card rounded-lg border border-fb-divider shadow-2xs flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-fb-blue shrink-0" />
                <span className="font-semibold">
                  Messenger realtime & Khung avatar
                </span>
              </div>
            </div>
          </div>

          {/* ================= CỘT PHẢI (45%): FORM CARD ĐĂNG NHẬP / ĐĂNG KÝ ================= */}
          <div className="lg:col-span-6 max-w-md w-full mx-auto">
            <div className="bg-fb-card rounded-lg shadow-xl border border-fb-divider p-6 sm:p-8 space-y-5">
              {/* MÀN 1: ĐĂNG NHẬP (AUTH.01) */}
              <div className="space-y-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold text-fb-text">
                    Đăng nhập tài khoản trường
                  </h3>
                  <p className="text-xs text-fb-text-2 mt-1">
                    Nhập email và mật khẩu tài khoản của bạn
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block text-xs font-semibold text-fb-text mb-1"
                    >
                      Email tài khoản
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-fb-text-3 absolute left-3 top-3 pointer-events-none" />
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="username"
                        placeholder="Email tài khoản"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setLoginError('');
                        }}
                        aria-invalid={Boolean(loginError)}
                        className={`w-full pl-9 pr-3 py-2.5 rounded-lg border bg-fb-inset text-xs text-fb-text transition focus:outline-hidden focus:ring-2 ${
                          loginError
                            ? 'border-fb-danger focus:ring-fb-danger'
                            : 'border-fb-divider focus:ring-fb-blue'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label
                        htmlFor="login-password"
                        className="text-xs font-semibold text-fb-text"
                      >
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
                        className="text-xs text-fb-blue hover:underline"
                      >
                        Cần đặt lại mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-fb-text-3 absolute left-3 top-3 pointer-events-none" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setLoginError('');
                        }}
                        aria-invalid={Boolean(loginError)}
                        className={`w-full pl-9 pr-9 py-2.5 rounded-lg border bg-fb-inset text-xs text-fb-text transition focus:outline-hidden focus:ring-2 ${
                          loginError
                            ? 'border-fb-danger focus:ring-fb-danger'
                            : 'border-fb-divider focus:ring-fb-blue'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-fb-text-3 hover:text-fb-text-2"
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
                    <p
                      role="alert"
                      className="rounded-lg border border-fb-danger/30 bg-fb-danger-soft px-3 py-2 text-xs text-fb-danger"
                    >
                      {loginError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-fb-blue hover:bg-fb-blue-hover disabled:opacity-60 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </button>
                </form>

                {/* Ghi chú tài khoản test cho team */}
                <div className="mt-4 pt-4 border-t border-fb-divider space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-fb-text flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-fb-blue" />
                      Tài khoản test (Mật khẩu:{' '}
                      <code className="bg-fb-input px-1.5 py-0.5 rounded text-fb-blue tabular-nums font-bold">
                        {mockDemoPassword}
                      </code>
                      )
                    </span>
                    <span className="text-xs text-fb-text-3">
                      Nhấn để điền
                    </span>
                  </div>

                  {/* Nhóm Giảng viên */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-fb-blue block">
                      Giảng viên:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { email: 'gv1@gmail.com', name: 'TS. Trần Minh Đức' },
                        { email: 'gv2@gmail.com', name: 'PGS. TS. Vũ Hải Yến' },
                      ].map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => {
                            setEmail(acc.email);
                            setPassword(mockDemoPassword);
                            setLoginError('');
                          }}
                          className="px-2 py-1.5 bg-fb-blue-soft hover:bg-fb-blue/20 border border-fb-blue/30 rounded-lg text-left transition cursor-pointer"
                        >
                          <p className="text-xs font-bold text-fb-blue truncate tabular-nums">
                            {acc.email}
                          </p>
                          <p className="text-xs text-fb-text-2 truncate">
                            {acc.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nhóm Sinh viên */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-fb-blue block">
                      Sinh viên:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { email: 'sv1@gmail.com', name: 'Văn Nam' },
                        { email: 'sv2@gmail.com', name: 'Thuỳ Dung' },
                        { email: 'sv3@gmail.com', name: 'Quang Huy' },
                        { email: 'sv4@gmail.com', name: 'Mai Anh' },
                        { email: 'sv5@gmail.com', name: 'Quốc Bảo' },
                      ].map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => {
                            setEmail(acc.email);
                            setPassword(mockDemoPassword);
                            setLoginError('');
                          }}
                          className="px-2 py-1.5 bg-fb-blue-soft hover:bg-fb-blue/20 border border-fb-blue/30 rounded-lg text-left transition cursor-pointer"
                        >
                          <p className="text-xs font-bold text-fb-blue truncate tabular-nums">
                            {acc.email}
                          </p>
                          <p className="text-xs text-fb-text-2 truncate">
                            {acc.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-fb-divider text-center text-xs text-fb-text-2">
        <p>
          © 2026 UniSocial & ExamBank Đại học. Nền tảng Mạng xã hội học tập &
          Ngân hàng đề thi chuẩn Quốc gia.
        </p>
      </footer>
    </div>
  );
};
