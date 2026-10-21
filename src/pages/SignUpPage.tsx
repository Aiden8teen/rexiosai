import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MascotRex } from '../components/MascotRex';
import { AlertCircle } from 'lucide-react';
import { apiErrorMessage } from '../api/client';
import type { AccountType } from '../api/contracts';

export const SignUpPage: React.FC = () => {
  const { lang, setLang, signup } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [error, setError] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('TALENT');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError(
        lang === 'ar'
          ? 'يرجى إدخال بريد إلكتروني صحيح'
          : 'Please enter a valid email address'
      );
      return;
    }

    if (password.length < 8 || !/\d/.test(password)) {
      setError(
        lang === 'ar'
          ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتتضمن رقمًا واحدًا'
          : 'Password must be at least 8 characters and include a digit'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        lang === 'ar'
          ? 'كلمتا المرور غير متطابقتين'
          : 'Passwords do not match'
      );
      return;
    }

    if (!termsAccepted) {
      setError(
        lang === 'ar'
          ? 'يجب الموافقة على شروط الاستخدام للمتابعة'
          : 'You must agree to the terms to proceed'
      );
      return;
    }

    const displayName = name.trim();
    setBusy(true);
    try {
      const user = await signup(displayName, email, password, accountType);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || (user.role === 'company' ? '/company/problems' : '/welcome'), { replace: true });
    } catch (apiError) {
      setError(apiErrorMessage(apiError, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 card-pixel overflow-hidden">
        <div className="md:col-span-5 bg-[#0B2A9E] text-[#FFFBF1] p-8 flex flex-col justify-between border-b-2 md:border-b-0 md:border-e-2 border-[#12122B]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#FFFBF1] border border-[#12122B] rounded">
              <MascotRex width={28} height={21} />
            </div>
            <span className="font-brand text-xl font-bold tracking-tight text-[#FFFBF1]">
              REXIOS AI
            </span>
          </div>

          <div className="my-10 flex flex-col items-center text-center">
            <div className="p-4 bg-[#1B3FC4] border-2 border-[#FFFBF1] rounded-lg shadow-pixel-s mb-6">
              <MascotRex width={80} height={60} />
            </div>
            <h2 className="text-xl font-bold mb-3">
              {lang === 'ar' ? 'انضم إلى مجتمع التقنيين' : 'Join the technologist community'}
            </h2>
            <p className="text-xs text-[#C9D3FF] leading-relaxed max-w-xs">
              {lang === 'ar'
                ? 'اسأل، أجب، وتعلّم من مشكلات حقيقية يواجهها زملاؤك في الصناعة والتطوير.'
                : 'Ask, answer, and learn from real problems faced by peers in engineering & industry.'}
            </p>
          </div>

          <div className="text-[11px] text-[#C9D3FF] text-center">
            {lang === 'ar'
              ? 'مشروع تخرج منصة Thirduni — 2026'
              : 'Thirduni Graduation Project — 2026'}
          </div>
        </div>

        <div className="md:col-span-7 bg-[#FFFBF1] p-6 sm:p-10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <span className="font-brand text-xs font-bold text-[#5B5B7B] uppercase">
              {lang === 'ar' ? 'حساب Rexios' : 'Rexios Account'}
            </span>
            <div className="flex items-center bg-[#EFE4CC] border-2 border-[#12122B] rounded-full p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLang('ar')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  lang === 'ar' ? 'bg-[#0B2A9E] text-[#FFFBF1]' : 'text-[#12122B]'
                }`}
              >
                عربي
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-[#0B2A9E] text-[#FFFBF1]' : 'text-[#12122B]'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#12122B] mb-1">
              {lang === 'ar' ? 'أنشئ حسابك' : 'Create your account'}
            </h1>
            <p className="text-xs text-[#5B5B7B] mb-6">
              {lang === 'ar' ? 'انضم للمجتمع في أقل من دقيقة.' : 'Join the community in under a minute.'}
            </p>

            <button
              type="button"
              onClick={() => undefined}
              className="w-full py-2.5 px-4 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md text-xs font-bold text-[#12122B] shadow-pixel-s hover:bg-[#EFE4CC] flex items-center justify-center gap-2 cursor-pointer mb-5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{lang === 'ar' ? 'التسجيل عبر Google' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-0.5 bg-[#DCCDAA]" />
              <span className="text-[11px] font-semibold text-[#5B5B7B]">
                {lang === 'ar' ? 'أو بالبريد الإلكتروني' : 'or with email'}
              </span>
              <div className="flex-1 h-0.5 bg-[#DCCDAA]" />
            </div>

            {error && (
              <div className="p-3 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs text-[#E5432A] font-semibold flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#12122B] mb-1">
                  {lang === 'ar' ? 'الاسم الكامل *' : 'Full name *'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: أمين بن علي' : 'e.g. Amine Ben Ali'}
                  className="w-full input-pixel text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12122B] mb-1">
                  {lang === 'ar' ? 'البريد الإلكتروني *' : 'Email address *'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full input-pixel text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12122B] mb-1">
                  {lang === 'ar' ? 'نوع الحساب *' : 'Account type *'}
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  className="w-full input-pixel text-xs bg-[#FFFBF1]"
                >
                  <option value="TALENT">{lang === 'ar' ? 'موهبة / خبير حلول' : 'Talent / Solver'}</option>
                  <option value="COMPANY">{lang === 'ar' ? 'شركة' : 'Company'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12122B] mb-1">
                  {lang === 'ar' ? 'كلمة المرور *' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full input-pixel text-xs"
                  required
                />
                <p className="text-[11px] text-[#5B5B7B] mt-1">
                  {lang === 'ar'
                    ? '8 أحرف على الأقل، تتضمن رقمًا واحدًا'
                    : 'At least 8 characters including a digit'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12122B] mb-1">
                  {lang === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm password *'}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full input-pixel text-xs"
                  required
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer mt-1 select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 accent-[#0B2A9E]"
                />
                <span className="text-xs text-[#5B5B7B]">
                  {lang === 'ar'
                    ? 'أوافق على شروط الاستخدام وسياسة الخصوصية'
                    : 'I agree to the Terms of Service and Privacy Policy'}
                </span>
              </label>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 mt-2 rounded-md font-bold text-xs btn-pixel-accent cursor-pointer"
              >
                {busy ? (lang === 'ar' ? 'جارٍ إنشاء الحساب…' : 'Creating account…') : (lang === 'ar' ? 'إنشاء حساب' : 'Create account')}
              </button>
            </form>
          </div>

          <div className="pt-6 text-center text-xs text-[#5B5B7B]">
            <span>{lang === 'ar' ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}</span>
            <Link to="/signin" state={location.state} className="font-bold text-[#0B2A9E] underline">
              {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
