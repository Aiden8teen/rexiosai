import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MascotRex } from './MascotRex';
import {
  Home,
  MessageSquare,
  BriefcaseBusiness,
  Info,
  X,
  LogOut,
  PlusCircle,
  FileText,
  Award,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { UserRole } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CollapsibleSidebar: React.FC<Props> = ({ open, onClose }) => {
  const { lang, setLang, dir, currentRole, currentUser, switchRole, logout } = useApp();
  const location = useLocation();
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const pathnameRef = React.useRef(location.pathname);
  useEffect(() => {
    if (pathnameRef.current !== location.pathname) {
      pathnameRef.current = location.pathname;
      onClose();
    }
  }, [location.pathname, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const homeTo =
    currentRole === 'company'
      ? '/company/problems'
      : currentRole === 'solver'
      ? '/problems'
      : currentRole === 'member'
      ? '/community'
      : '/';

  const roleLabels: Record<UserRole, { ar: string; en: string }> = {
    visitor: { ar: 'زائر', en: 'Visitor' },
    member: { ar: 'عضو', en: 'Member' },
    solver: { ar: 'خبير حلول', en: 'Solver' },
    company: { ar: 'شركة', en: 'Company' },
  };

  const navLinks = [
    {
      to: homeTo,
      label: { ar: 'الرئيسية', en: 'Home' },
      icon: Home,
      exact: true,
    },
    {
      to: '/problems',
      label: { ar: 'التحديات الصناعية', en: 'Problems' },
      icon: BriefcaseBusiness,
    },
    ...(currentRole === 'company'
      ? [
          {
            to: '/company/problems',
            label: { ar: 'تحديات شركتي', en: 'My Challenges' },
            icon: BriefcaseBusiness,
          },
        ]
      : []),
    ...(currentRole === 'solver'
      ? [
          {
            to: '/my-applications',
            label: { ar: 'طلباتي وعروضي', en: 'My Applications' },
            icon: FileText,
          },
          {
            to: '/profile/solver',
            label: { ar: 'ملف خبير الحلول', en: 'Solver Profile' },
            icon: Award,
          },
        ]
      : []),
    {
      to: '/community',
      label: { ar: 'المجتمع التقني', en: 'Community' },
      icon: MessageSquare,
    },
    {
      to: '/about',
      label: { ar: 'عن المنصة', en: 'About' },
      icon: Info,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-[#12122B]/60 backdrop-blur-xs transition-opacity animate-in fade-in cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'ar' ? 'القائمة الجانبية' : 'Navigation Sidebar'}
        className="fixed inset-y-0 start-0 z-50 w-76 sm:w-84 max-w-[85vw] bg-[#FFFBF1] border-e-2 border-[#12122B] shadow-pixel-l flex flex-col justify-between overflow-y-auto animate-in slide-in-from-start duration-200"
      >
        <div className="p-5 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#12122B]">
            <Link to={homeTo} onClick={onClose} className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s">
                <MascotRex width={28} height={21} />
              </div>
              <span className="font-brand text-lg font-bold tracking-tight text-[#12122B]">
                REXIOS AI
              </span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-[#EFE4CC] border border-[#12122B] cursor-pointer"
              aria-label={lang === 'ar' ? 'إغلاق القائمة' : 'Close Sidebar'}
            >
              <X className="w-5 h-5 text-[#12122B]" />
            </button>
          </div>

          {currentUser ? (
            <div className="p-3 bg-[#EEF1FF] border-2 border-[#12122B] rounded-lg shadow-pixel-s flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-[#FFFBF1] shrink-0 border border-[#12122B]"
                  style={{ backgroundColor: currentUser.avatarBg || '#0B2A9E' }}
                >
                  {lang === 'ar'
                    ? currentUser.avatarChar
                    : currentUser.name_en?.trim().slice(0, 1) || currentUser.avatarChar}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#12122B] truncate">
                    {lang === 'ar' ? currentUser.name : currentUser.name_en || currentUser.name}
                  </p>
                  <p className="text-[11px] text-[#5B5B7B] truncate">{currentUser.email}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[#C6FF3D] border border-[#12122B] rounded-full text-[10px] font-bold text-[#12122B] shrink-0">
                {roleLabels[currentUser.role][lang]}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/signup"
                onClick={onClose}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-bold text-xs btn-pixel-accent text-center"
              >
                <span>{lang === 'ar' ? 'إنشاء حساب جديد' : 'Sign up'}</span>
              </Link>
              <Link
                to="/signin"
                onClick={onClose}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-bold text-xs btn-pixel-secondary text-center"
              >
                <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</span>
              </Link>
            </div>
          )}

          <nav className="flex flex-col gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-[#5B5B7B] uppercase tracking-wider px-1">
              {lang === 'ar' ? 'التنقل الرئيسي' : 'Main Navigation'}
            </span>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact
                ? location.pathname === link.to
                : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#0B2A9E] text-[#FFFBF1] shadow-pixel-s'
                      : 'text-[#12122B] hover:bg-[#EFE4CC]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFFBF1]' : 'text-[#0B2A9E]'}`} />
                    <span>{link.label[lang]}</span>
                  </div>
                  <ChevronIcon className="w-3.5 h-3.5 opacity-60" />
                </Link>
              );
            })}
          </nav>

          {currentUser && (
            <div className="pt-2">
              {currentRole === 'company' ? (
                <Link
                  to="/company/problems/new"
                  onClick={onClose}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-bold text-xs btn-pixel-accent text-center"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'طرح تحدٍّ صناعي جديد +' : 'Post a Problem +'}</span>
                </Link>
              ) : (
                <Link
                  to="/community/ask"
                  onClick={onClose}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-bold text-xs btn-pixel-primary text-center"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'اطرح سؤالًا في المجتمع' : 'Ask a Question'}</span>
                </Link>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-[#EFE4CC] flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#5B5B7B] uppercase tracking-wider px-1">
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'اللغة / Language' : 'Language'}</span>
            </span>
            <div className="grid grid-cols-2 gap-2 bg-[#F8F1E1] p-1 border border-[#12122B] rounded-md">
              <button
                type="button"
                onClick={() => setLang('ar')}
                className={`py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  lang === 'ar'
                    ? 'bg-[#0B2A9E] text-[#FFFBF1] shadow-pixel-s'
                    : 'text-[#12122B] hover:bg-[#EFE4CC]'
                }`}
              >
                العربية (DZ)
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#0B2A9E] text-[#FFFBF1] shadow-pixel-s'
                    : 'text-[#12122B] hover:bg-[#EFE4CC]'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#EFE4CC] flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#5B5B7B] uppercase tracking-wider px-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تبديل الدور للتجربة:' : 'Demo Role Switcher:'}</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(['visitor', 'member', 'solver', 'company'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    void switchRole(r);
                    onClose();
                  }}
                  className={`px-2 py-1.5 rounded text-xs font-bold text-center transition-all cursor-pointer ${
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

        {currentUser && (
          <div className="p-4 border-t-2 border-[#12122B] bg-[#FFF1CC]">
            <button
              type="button"
              onClick={() => {
                void logout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-bold text-xs text-[#E5432A] hover:bg-[#FFE3DC] border border-[#E5432A]/30 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تسجيل الخروج من الحساب' : 'Sign out'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
