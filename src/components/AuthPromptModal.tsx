import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MascotRex } from './MascotRex';
import { X } from 'lucide-react';

export const AuthPromptModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, lang } = useApp();
  const navigate = useNavigate();

  if (!isAuthModalOpen) return null;

  const content = {
    title: {
      ar: 'انضم إلى مجتمع Rexios AI للمشاركة',
      en: 'Join the community to participate',
    },
    body: {
      ar: 'بإمكانك الاطّلاع على الأسئلة والتحديات كزائر، لكن طرح الاستفسارات وتقديم الحلول والمشاركة تتطلب حساباً مسجلاً.',
      en: 'You can read questions and answers as a visitor, but asking questions, writing answers, and reacting require an account.',
    },
    signupBtn: {
      ar: 'إنشاء حساب جديد',
      en: 'Create an account',
    },
    signinBtn: {
      ar: 'تسجيل الدخول',
      en: 'Sign in',
    },
    continueVisitorBtn: {
      ar: 'متابعة الاستكشاف كزائر',
      en: 'Continue browsing as a visitor',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 scrim-modal animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#FFFBF1] border-2 border-[#12122B] rounded-lg p-7 shadow-pixel-l flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 start-4 p-1 rounded-sm text-[#5B5B7B] hover:text-[#12122B] hover:bg-[#EFE4CC] cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="mb-4 mt-2 p-3 bg-[#EEF1FF] border-2 border-[#12122B] rounded-lg shadow-pixel-s">
          <MascotRex width={64} height={48} />
        </div>

        <h3 className="text-xl font-bold text-[#12122B] mb-2">
          {content.title[lang]}
        </h3>

        <p className="text-sm text-[#5B5B7B] mb-6 leading-relaxed">
          {content.body[lang]}
        </p>

        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              closeAuthModal();
              navigate('/signup');
            }}
            className="w-full py-2.5 px-4 rounded-md font-bold text-sm btn-pixel-accent cursor-pointer"
          >
            {content.signupBtn[lang]}
          </button>

          <button
            type="button"
            onClick={() => {
              closeAuthModal();
              navigate('/signin');
            }}
            className="w-full py-2.5 px-4 rounded-md font-bold text-sm btn-pixel-secondary cursor-pointer"
          >
            {content.signinBtn[lang]}
          </button>

          <button
            type="button"
            onClick={closeAuthModal}
            className="w-full py-2 text-xs font-semibold text-[#5B5B7B] hover:text-[#12122B] underline cursor-pointer"
          >
            {content.continueVisitorBtn[lang]}
          </button>
        </div>
      </div>
    </div>
  );
};
