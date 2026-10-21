import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MascotRex } from './MascotRex';
import { ChevronDown, LogOut, Award, BriefcaseBusiness, FileText, Menu, X, PlusCircle } from 'lucide-react';
import type { UserRole } from '../types';
import { NotificationsDropdown } from './NotificationsDropdown';

export const Navbar: React.FC = () => {
  const { lang, setLang, currentRole, currentUser, switchRole, logout } = useApp();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: { ar: 'الرئيسية', en: 'Home' } },
    { to: '/community', label: { ar: 'المجتمع التقني', en: 'Community' } },
    { to: '/problems', label: { ar: 'التحديات الصناعية', en: 'Problems' } },
    ...(currentRole === 'company'
      ? [{ to: '/company/problems', label: { ar: 'تحديات شركتي', en: 'My Challenges' } }]
      : []),
    { to: '/about', label: { ar: 'عن المنصة', en: 'About' } },
  ];

  const roleLabels: Record<UserRole, { ar: string; en: string }> = {
    visitor: { ar: 'زائر', en: 'Visitor' },
    member: { ar: 'عضو', en: 'Member' },
    solver: { ar: 'خبير حلول', en: 'Solver' },
    company: { ar: 'شركة', en: 'Company' },
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFBF1] border-b-2 border-[#12122B] shadow-pixel-s">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 h-18 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 lg:gap-4 xl:gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5 group whitespace-nowrap">
            <div className="p-1 sm:p-1.5 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s group-hover:scale-105 transition-transform">
              <MascotRex width={28} height={21} className="sm:w-8 sm:h-[24px]" />
            </div>
            <span className="font-brand text-base sm:text-xl font-bold tracking-tight text-[#12122B] whitespace-nowrap">
              REXIOS AI
            </span>
          </Link>

          <nav className="hidden lg:flex shrink-0 items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-2.5 xl:px-3 py-1.5 rounded-md text-xs xl:text-sm font-semibold whitespace-nowrap transition-all ${
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

        <div className="flex shrink-0 items-center gap-2 xl:gap-2.5">
          <div className="hidden xl:flex items-center shrink-0 flex-nowrap bg-[#EFE4CC] border-2 border-[#12122B] rounded-full p-0.5 text-xs shadow-pixel-s">
            {(['visitor', 'member', 'solver', 'company'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => switchRole(r)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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

          <div className="flex items-center shrink-0 bg-[#FFFBF1] border-2 border-[#12122B] rounded-full p-0.5 shadow-pixel-s text-xs font-bold">
            <button
              type="button"
              onClick={() => setLang('ar')}
              className={`px-2 py-0.5 rounded-full text-[11px] transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
              className={`px-2 py-0.5 rounded-full text-[11px] transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-bold rounded-md btn-pixel-secondary whitespace-nowrap shrink-0"
              >
                {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
              <Link
                to="/signup"
                className="inline-flex px-3.5 py-1.5 text-xs font-bold rounded-md btn-pixel-accent whitespace-nowrap shrink-0"
              >
                {lang === 'ar' ? 'إنشاء حساب' : 'Sign up'}
              </Link>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              {currentRole === 'company' ? (
                <Link
                  to="/company/problems/new"
                  className="hidden lg:inline-flex px-3 py-1.5 text-xs font-bold rounded-md btn-pixel-accent whitespace-nowrap shrink-0"
                >
                  {lang === 'ar' ? 'طرح مشكلة +' : 'Post a Problem +'}
                </Link>
              ) : (
                <Link
                  to="/community/ask"
                  className="hidden lg:inline-flex px-3 py-1.5 text-xs font-bold rounded-md btn-pixel-primary whitespace-nowrap shrink-0"
                >
                  {lang === 'ar' ? 'اطرح سؤالًا' : 'Ask a Question'}
                </Link>
              )}

              <NotificationsDropdown key={currentUser.id} userId={currentUser.id} lang={lang} />

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
                    {lang === 'ar'
                      ? currentUser.avatarChar
                      : currentUser.name_en?.trim().slice(0, 1) || currentUser.avatarChar}
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
                        {lang === 'ar' ? currentUser.name : (currentUser.name_en || currentUser.name)}
                      </p>
                      <p className="text-[11px] text-[#5B5B7B] truncate">
                        {currentUser.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#C6FF3D] border border-[#12122B] rounded-full text-[10px] font-bold text-[#12122B]">
                        {roleLabels[currentUser.role][lang]}
                      </span>
                    </div>

                    <div className="xl:hidden px-2 py-1.5 border-b border-[#EFE4CC] mb-1">
                      <p className="text-[10px] font-bold text-[#5B5B7B] mb-1">
                        {lang === 'ar' ? 'تبديل الدور:' : 'Switch Role:'}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {(['visitor', 'member', 'solver', 'company'] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void switchRole(r);
                              setProfileDropdownOpen(false);
                            }}
                            className={`px-1.5 py-1 rounded text-[10px] font-bold text-center transition-all cursor-pointer ${
                              currentRole === r
                                ? 'bg-[#12122B] text-[#C6FF3D]'
                                : 'bg-[#EFE4CC] text-[#12122B] hover:bg-[#DCCDAA]'
                            }`}
                          >
                            {roleLabels[r][lang]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {currentRole === 'company' ? (
                      <Link to="/company/problems" className="flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold text-[#12122B] hover:bg-[#EFE4CC]">
                        <BriefcaseBusiness className="w-4 h-4 text-[#0B2A9E]" />
                        <span>{lang === 'ar' ? 'تحديات شركتي' : 'My Challenges'}</span>
                      </Link>
                    ) : (
                      <>
                        <Link to="/my-applications" className="flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold text-[#12122B] hover:bg-[#EFE4CC]">
                          <FileText className="w-4 h-4 text-[#0B2A9E]" />
                          <span>{lang === 'ar' ? 'طلباتي وعروضي' : 'My Applications'}</span>
                        </Link>
                        <Link to="/profile/solver" className="flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold text-[#12122B] hover:bg-[#EFE4CC]">
                          <Award className="w-4 h-4 text-[#0B2A9E]" />
                          <span>{lang === 'ar' ? 'ملف خبير الحلول' : 'Solver Profile'}</span>
                        </Link>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => { void logout(); }}
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

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-md bg-[#FFFBF1] border-2 border-[#12122B] shadow-pixel-s hover:bg-[#EFE4CC] cursor-pointer shrink-0"
            aria-label={mobileMenuOpen ? (lang === 'ar' ? 'إغلاق القائمة' : 'Close menu') : (lang === 'ar' ? 'فتح القائمة' : 'Open menu')}
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#12122B]" />
            ) : (
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-[#12122B]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FFFBF1] border-t-2 border-[#12122B] shadow-pixel-m px-4 py-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-bold transition-all ${
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

          <div className="pt-2 border-t border-[#EFE4CC] flex flex-col gap-2">
            {currentRole === 'company' ? (
              <Link
                to="/company/problems/new"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-bold text-xs btn-pixel-accent text-center"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{lang === 'ar' ? 'طرح تحدٍّ صناعي جديد +' : 'Post a Problem +'}</span>
              </Link>
            ) : (
              <Link
                to="/community/ask"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-bold text-xs btn-pixel-primary text-center"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{lang === 'ar' ? 'اطرح سؤالًا في المجتمع' : 'Ask a Question'}</span>
              </Link>
            )}
          </div>

          <div className="pt-2 border-t border-[#EFE4CC] flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#5B5B7B] uppercase tracking-wider">
              {lang === 'ar' ? 'تبديل الدور للتجربة:' : 'Quick Demo Role Switch:'}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(['visitor', 'member', 'solver', 'company'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    void switchRole(r);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2.5 py-1.5 rounded text-xs font-bold text-center transition-all cursor-pointer ${
                    currentRole === r
                      ? 'bg-[#12122B] text-[#C6FF3D] shadow-pixel-s'
                      : 'bg-[#EFE4CC] text-[#12122B] hover:bg-[#DCCDAA]'
                  }`}
                >
                  {roleLabels[r][lang]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
