import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Trophy,
  MessageCircle,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Mail,
  Lock,
  User,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { Role } from '../../types';

export const AuthPage: React.FC = () => {
  const { login, showToast } = useApp();

  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT'>('LOGIN');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register states
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [faculty, setFaculty] = useState('Khoa Công nghệ Thông tin');
  const [classOrTitle, setClassOrTitle] = useState('K64 - CNTT 02');

  // OTP states
  const [otpCodes, setOtpCodes] = useState(['5', '8', '2', '9', '1', '4']);
  const [countdown, setCountdown] = useState(60);

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Vui lòng nhập đầy đủ Email trường và Mật khẩu', 'warning');
      return;
    }
    // Check role based on email or default to STUDENT
    const isLecturer = email.toLowerCase().includes('duc') || email.toLowerCase().includes('gv') || email.toLowerCase().includes('yen');
    login(isLecturer ? 'LECTURER' : 'STUDENT', {
      email,
      name: isLecturer ? 'TS. Trần Minh Đức' : 'Tuấn Anh gay'
    });
  };

  // Register handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast('Vui lòng điền đầy đủ các trường bắt buộc', 'warning');
      return;
    }
    if (!email.endsWith('@truong.edu.vn') && !email.includes('.edu.vn')) {
      showToast('Email phải thuộc tên miền giáo dục đại học (*.edu.vn)', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'warning');
      return;
    }
    setAuthMode('OTP');
    showToast('Mã OTP 6 số đã được gửi tới hộp thư trường của bạn!', 'info');
  };

  // OTP Verify handler
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(role, {
      name,
      email,
      role,
      faculty,
      classOrTitle
    });
  };

  // Quick Demo Logins
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
              Mạng xã hội học tập kết hợp Ngân hàng đề thi Đại học chuẩn hóa. Sinh viên đề xuất câu hỏi thi, Giảng viên kiểm duyệt và cùng tham gia các minigame dự đoán sôi nổi.
            </p>

            {/* Academic Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0 pt-2 text-xs text-gray-700 dark:text-gray-300">
              <div className="p-3 bg-white dark:bg-[#242526] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold">Ngân hàng đề thi chuẩn Quốc gia</span>
              </div>

              <div className="p-3 bg-white dark:bg-[#242526] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Hội đồng Giảng viên phê duyệt</span>
              </div>

              <div className="p-3 bg-white dark:bg-[#242526] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-semibold">Minigame & Bảng vàng cống hiến</span>
              </div>

              <div className="p-3 bg-white dark:bg-[#242526] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold">Messenger realtime & Khung avatar</span>
              </div>
            </div>
          </div>

          {/* ================= CỘT PHẢI (45%): FORM CARD ĐĂNG NHẬP / ĐĂNG KÝ ================= */}
          <div className="lg:col-span-6 max-w-md w-full mx-auto">
            <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 space-y-5">
              {/* MÀN 1: ĐĂNG NHẬP (AUTH.01) */}
              {authMode === 'LOGIN' && (
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
                        Email trường (@truong.edu.vn)
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
                          onClick={() => setAuthMode('FORGOT')}
                          className="text-[11px] text-blue-600 hover:underline"
                        >
                          Quên mật khẩu?
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
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                    >
                      Đăng nhập
                    </button>
                  </form>

                  <div className="relative flex py-1 items-center">
                    <div className="grow border-t border-gray-200 dark:border-gray-700"></div>
                    <span className="shrink mx-4 text-gray-400 text-xs uppercase font-semibold">hoặc</span>
                    <div className="grow border-t border-gray-200 dark:border-gray-700"></div>
                  </div>

                  {/* Nút Tạo tài khoản mới kiểu Facebook */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setAuthMode('REGISTER')}
                      className="px-6 py-2.5 bg-[#42B72A] hover:bg-[#36A420] text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      Tạo tài khoản mới
                    </button>
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
                        className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition text-center"
                      >
                        👨‍🎓 Sinh viên (Nam)
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickLecturerLogin}
                        className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition text-center"
                      >
                        👨‍🏫 Giảng viên (TS. Đức)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MÀN 2: ĐĂNG KÝ (AUTH.02) */}
              {authMode === 'REGISTER' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('LOGIN')}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Đăng ký tài khoản mới
                      </h3>
                      <p className="text-xs text-gray-500">
                        Nhanh chóng và dễ dàng dành cho Sinh viên & Giảng viên
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#3A3B3C] border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Email trường (*.edu.vn) *
                      </label>
                      <input
                        type="email"
                        placeholder="sinhvien@truong.edu.vn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#3A3B3C] border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Mật khẩu *
                        </label>
                        <input
                          type="password"
                          placeholder="Mật khẩu"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-[#3A3B3C] border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Nhập lại *
                        </label>
                        <input
                          type="password"
                          placeholder="Xác nhận"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-[#3A3B3C] border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Vai trò tại trường:
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setRole('STUDENT')}
                          className={`p-2 rounded-xl font-bold border transition ${
                            role === 'STUDENT'
                              ? 'border-blue-600 bg-blue-50 text-blue-600 ring-1 ring-blue-600'
                              : 'border-gray-300 text-gray-600'
                          }`}
                        >
                          Sinh viên
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('LECTURER')}
                          className={`p-2 rounded-xl font-bold border transition ${
                            role === 'LECTURER'
                              ? 'border-purple-600 bg-purple-50 text-purple-600 ring-1 ring-purple-600'
                              : 'border-gray-300 text-gray-600'
                          }`}
                        >
                          Giảng viên
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Khoa / Viện
                        </label>
                        <select
                          value={faculty}
                          onChange={(e) => setFaculty(e.target.value)}
                          className="w-full p-2 bg-gray-50 dark:bg-[#3A3B3C] border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100"
                        >
                          <option value="Khoa Công nghệ Thông tin">Khoa CNTT</option>
                          <option value="Khoa Mạng Máy tính & Truyền thông">Khoa Mạng máy tính</option>
                          <option value="Khoa Toán - Tin ứng dụng">Khoa Toán - Tin</option>
                          <option value="Khoa Điện tử Viễn thông">Khoa Điện tử</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Lớp / Chức danh
                        </label>
                        <input
                          type="text"
                          value={classOrTitle}
                          onChange={(e) => setClassOrTitle(e.target.value)}
                          placeholder="K64 - CNTT"
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-[#3A3B3C] border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#42B72A] hover:bg-[#36A420] text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      Tiếp tục: Xác thực OTP
                    </button>
                  </form>

                  <p className="text-center text-xs text-gray-500">
                    Đã có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('LOGIN')}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Đăng nhập tại đây
                    </button>
                  </p>
                </div>
              )}

              {/* MÀN 3: XÁC THỰC OTP 6 Ô (AUTH.03) */}
              {authMode === 'OTP' && (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Xác thực mã OTP (AUTH.03)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Mã xác nhận 6 số đã được gửi tới email trường: <br />
                      <strong className="text-gray-800 dark:text-gray-200">{email || 'nam.nh2054@truong.edu.vn'}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div className="flex justify-center gap-2">
                      {otpCodes.map((code, idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          value={code}
                          readOnly
                          className="w-10 h-12 text-center font-black text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                        />
                      ))}
                    </div>

                    <p className="text-xs text-gray-400">
                      Mã có hiệu lực trong: <strong className="text-blue-600">{countdown}s</strong>
                    </p>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                    >
                      Xác nhận & Hoàn tất đăng ký
                    </button>
                  </form>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setAuthMode('REGISTER')}
                      className="hover:underline"
                    >
                      Đổi email khác
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Đã gửi lại mã OTP mới!', 'info')}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Gửi lại mã OTP
                    </button>
                  </div>
                </div>
              )}

              {/* MÀN 4: QUÊN MẬT KHẨU */}
              {authMode === 'FORGOT' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('LOGIN')}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Khôi phục mật khẩu
                      </h3>
                      <p className="text-xs text-gray-500">
                        Nhập email trường để nhận hướng dẫn đặt lại mật khẩu
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      showToast('Đã gửi liên kết khôi phục mật khẩu vào email trường!', 'success');
                      setAuthMode('LOGIN');
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Email trường (*.edu.vn)
                      </label>
                      <input
                        type="email"
                        placeholder="sinhvien@truong.edu.vn"
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#3A3B3C] border border-gray-300 dark:border-gray-600 rounded-xl text-xs"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
                    >
                      Gửi liên kết khôi phục
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500">
        <p>© 2026 UniSocial & ExamBank Đại học. Nền tảng Mạng xã hội học tập & Ngân hàng đề thi chuẩn Quốc gia.</p>
      </footer>
    </div>
  );
};
