import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MascotRex } from './MascotRex';

export const Footer: React.FC = () => {
  const { lang } = useApp();

  return (
    <footer className="w-full bg-[#FFFBF1] border-t-2 border-[#12122B] mt-20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-[#FFFBF1] border-2 border-[#12122B] rounded shadow-pixel-s">
            <MascotRex width={32} height={24} />
          </div>
          <span className="font-brand text-xl font-bold tracking-tight text-[#12122B]">
            REXIOS AI
          </span>
        </div>

        <p className="text-xs text-[#5B5B7B] text-center md:text-start">
          {lang === 'ar'
            ? '© 2026 Rexios AI — حيث تلتقي الكفاءات الهندسية بالتحديات الصناعية الحقيقية. مبادرة مشروع تخرج منصة Thirduni.'
            : '© 2026 Rexios AI — Where tech skills meet real problems. Thirduni graduation initiative.'}
        </p>

        <div className="flex items-center gap-4 text-xs font-semibold text-[#12122B]">
          <Link to="/" className="hover:underline">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <Link to="/community" className="hover:underline">
            {lang === 'ar' ? 'المجتمع التقني' : 'Community'}
          </Link>
          <Link to="/problems" className="hover:underline">
            {lang === 'ar' ? 'التحديات الصناعية' : 'Problems'}
          </Link>
          <Link to="/about" className="hover:underline">
            {lang === 'ar' ? 'عن المنصة' : 'About'}
          </Link>
        </div>
      </div>
    </footer>
  );
};
