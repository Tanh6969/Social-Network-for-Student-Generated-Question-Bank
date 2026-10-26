import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { Role } from '../../demo/types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    loginWithCredentials,
    switchRole,
    showToast
  } = useApp();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'OTP'>(
    authModalMode === 'REGISTER' || authModalMode === 'OTP' ? authModalMode : 'LOGIN'
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Tuấn Anh gay');
  const [roleSelect, setRoleSelect] = useState<Role>('STUDENT');
  const [otpCodes, setOtpCodes] = useState(['5', '8', '2', '9', '1', '4']);
  const [countdown, setCountdown] = useState(48);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setLoginError('');
    setIsSubmitting(true);
    try {
      await loginWithCredentials(email, password);
      closeAuthModal();
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : 'Đăng nhập thất bại.',
      );
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@truong.edu.vn')) {
      showToast('Email phải thuộc tên miền đại học (@truong.edu.vn)', 'warning');
      return;
    }
    setMode('OTP');
    showToast('Mã xác thực OTP 6 số đã được gửi tới email trường của bạn!', 'info');
  };

  const handleVerifyOtp = () => {
    switchRole(roleSelect);
    showToast('Xác thực OTP thành công! Chào mừng bạn gia nhập UniSocial.', 'success');
    closeAuthModal();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#242526] rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-200 dark:border-gray-700 relative">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-800"
        >
          <X className="w-5 h-5" />
        </button>

        {mode === 'LOGIN' ? (
          /* AUTH.01: SPLIT 2-COLUMN FACEBOOK LOGIN */
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
            {/* Left Brand Hero (55%) */}
            <div className="md:col-span-6 bg-linear-to-tr from-blue-700 via-blue-600 to-indigo-700 p-8 text-white flex flex-col justify-center">
              <div className="w-14 h-14 rounded-2xl bg-white text-blue-700 flex items-center justify-center font-black text-3xl shadow-lg mb-4">
                U
              </div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
                UniSocial & ExamBank
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Học cùng bạn bè, đóng góp cùng thầy cô. Mạng xã hội học tập & Ngân hàng đề thi chuẩn Quốc gia.
              </p>
              <div className="space-y-2 text-xs text-blue-200">
                <p>✓ Sinh viên đề xuất câu hỏi thi</p>
                <p>✓ Giảng viên duyệt & AI hỗ trợ tinh chỉnh</p>
                <p>✓ Minigame dự đoán kết quả & nhận thưởng</p>
              </div>
            </div>

            {/* Right Form Card (45%) */}
            <div className="md:col-span-6 p-8 flex flex-col justify-center">
              <h3 className="font-black text-xl text-gray-900 dark:text-gray-100 mb-4">
                Đăng nhập tài khoản trường
              </h3>

              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Email tài khoản
                  </label>
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLoginError('');
                    }}
                    aria-invalid={Boolean(loginError)}
                    className={`w-full rounded-xl border p-2.5 text-xs text-gray-900 dark:bg-[#3A3B3C] dark:text-gray-100 ${
                      loginError
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-gray-50`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLoginError('');
                    }}
                    aria-invalid={Boolean(loginError)}
                    className={`w-full rounded-xl border p-2.5 text-xs text-gray-900 dark:bg-[#3A3B3C] dark:text-gray-100 ${
                      loginError
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-gray-50`}
                  />
                </div>

                {loginError && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                  >
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                <button
                  onClick={() => setMode('REGISTER')}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  Chưa có tài khoản? Tạo tài khoản mới (AUTH.02)
                </button>
              </div>
            </div>
          </div>
        ) : mode === 'REGISTER' ? (
          /* AUTH.02: REGISTER MODAL */
          <div className="p-8 max-w-lg mx-auto space-y-4">
            <h3 className="font-black text-xl text-gray-900 dark:text-gray-100 text-center">
              Đăng ký tài khoản trường (AUTH.02)
            </h3>
            <p className="text-xs text-gray-500 text-center">
              Yêu cầu sử dụng email có đuôi @truong.edu.vn để xác thực vai trò học thuật.
            </p>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-xl bg-gray-50 dark:bg-[#3A3B3C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Email trường (@truong.edu.vn) *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-xl bg-gray-50 dark:bg-[#3A3B3C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Mật khẩu khởi tạo *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-xl bg-gray-50 dark:bg-[#3A3B3C]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Gửi mã xác thực OTP
              </button>
            </form>

            <p className="text-center text-xs text-gray-500">
              Đã có tài khoản?{' '}
              <button
                onClick={() => setMode('LOGIN')}
                className="text-blue-600 font-bold hover:underline"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        ) : (
          /* AUTH.03: OTP 6 Ô */
          <div className="p-8 max-w-md mx-auto space-y-4 text-center">
            <h3 className="font-black text-xl text-gray-900 dark:text-gray-100">
              Xác thực OTP 6 Số (AUTH.03)
            </h3>
            <p className="text-xs text-gray-500">
              Mã bảo mật đã được gửi tới <strong>{email}</strong>. Có hiệu lực trong {countdown}s.
            </p>

            <div className="flex justify-center gap-2 py-4">
              {otpCodes.map((code, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={code}
                  readOnly
                  className="w-11 h-12 text-center font-black text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Xác nhận và Hoàn tất đăng ký
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
