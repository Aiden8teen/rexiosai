import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MascotRex } from './MascotRex';
import { Bell, ChevronDown, LogOut, Award } from 'lucide-react';
import type { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { lang, setLang, currentRole, currentUser, switchRole, logout } = useApp();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navLinks = [
    { to: '/', label: { ar: 'الرئيسية', en: 'Home' } },
    { to: '/community', label: { ar: 'المجتمع التقني', en: 'Community' } },
    { to: '/problems', label: { ar: 'التحديات الصناعية', en: 'Problems' } },
    { to: '/about', label: { ar: 'عن المنصة', en: 'About' } },
  ];

  const roleLabels: Record<UserRole, { ar: string; en: string }> = {
    visitor: { ar: 'زائر', en: 'Visitor' },
    member: { ar: 'عضو', en: 'Member' },
    solver: { ar: 'خبير حلول', en: 'Solver' },
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFBF1] border-b-2 border-[#12122B] shadow-pixel-s">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-6 sm:gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-1.5 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s group-hover:scale-105 transition-transform">
              <MascotRex width={36} height={27} />
            </div>
            <span className="font-brand text-2xl font-bold tracking-tight text-[#12122B]">
              REXIOS AI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0B2A9E] text-[#FFFBF1] shadow-pixel-s'
                      : 'text-[#12122B] hover:bg-[#EFE4CC]'
                  }`}
                >
                  {link.label[lang]}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center bg-[#EFE4CC] border-2 border-[#12122B] rounded-full p-0.5 text-xs">
            {(['visitor', 'member', 'solver'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => switchRole(r)}
                className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  currentRole === r
                    ? 'bg-[#12122B] text-[#C6FF3D]'
                    : 'text-[#5B5B7B] hover:text-[#12122B]'
                }`}
                title={`Switch view to ${r}`}
              >
                {roleLabels[r][lang]}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#FFFBF1] border-2 border-[#12122B] rounded-full p-0.5 shadow-pixel-s text-xs font-bold">
            <button
              type="button"
              onClick={() => setLang('ar')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                lang === 'ar'
                  ? 'bg-[#0B2A9E] text-[#FFFBF1]'
                  : 'text-[#12122B] hover:bg-[#EFE4CC]'
              }`}
            >
              عربي
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#0B2A9E] text-[#FFFBF1]'
                  : 'text-[#12122B] hover:bg-[#EFE4CC]'
              }`}
            >
              EN
            </button>
          </div>

          {currentRole === 'visitor' ? (
            <div className="flex items-center gap-2">
              <Link
                to="/signin"
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-bold rounded-md btn-pixel-secondary"
              >
                {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
              <Link
                to="/signup"
                className="inline-flex px-3.5 py-1.5 text-xs font-bold rounded-md btn-pixel-accent"
              >
                {lang === 'ar' ? 'إنشاء حساب' : 'Sign up'}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/community/ask"
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-bold rounded-md btn-pixel-primary"
              >
                {lang === 'ar' ? 'اطرح سؤالًا' : 'Ask a Question'}
              </Link>

              <button
                type="button"
                className="relative p-2 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s hover:bg-[#EFE4CC] cursor-pointer"
                title={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
              >
                <Bell className="w-4 h-4 text-[#12122B] stroke-[2.2]" />
                <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-[#E5432A] rounded-full border border-[#FFFBF1]" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 bg-[#FFFBF1] border-2 border-[#12122B] rounded-full shadow-pixel-s hover:bg-[#EFE4CC] cursor-pointer"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-[#FFFBF1]"
                    style={{ backgroundColor: currentUser.avatarBg || '#0B2A9E' }}
                  >
                    {currentUser.avatarChar}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#12122B] me-1" />
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute end-0 mt-2 w-56 bg-[#FFFBF1] border-2 border-[#12122B] rounded-lg shadow-pixel-m p-2 z-50 animate-in fade-in"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-[#EFE4CC] mb-1">
                      <p className="font-bold text-xs text-[#12122B]">
                        {lang === 'ar' ? currentUser.name : currentUser.name_en}
                      </p>
                      <p className="text-[11px] text-[#5B5B7B] truncate">
                        {currentUser.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#C6FF3D] border border-[#12122B] rounded-full text-[10px] font-bold text-[#12122B]">
                        {roleLabels[currentUser.role][lang]}
                      </span>
                    </div>

                    <Link
                      to="/profile/solver"
                      className="flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold text-[#12122B] hover:bg-[#EFE4CC]"
                    >
                      <Award className="w-4 h-4 text-[#0B2A9E]" />
                      <span>{lang === 'ar' ? 'ملف خبير الحلول' : 'Solver Profile'}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold text-[#E5432A] hover:bg-[#FFE3DC] cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
