import React from 'react';
import type { ProblemDifficulty } from '../types';
import { useApp } from '../context/AppContext';

interface DifficultyMeterProps {
  difficulty: ProblemDifficulty;
  showLabel?: boolean;
  className?: string;
}

export const DifficultyMeter: React.FC<DifficultyMeterProps> = ({
  difficulty,
  showLabel = true,
  className = '',
}) => {
  const { lang } = useApp();

  const labels = {
    small: { ar: 'أساسية', en: 'Small' },
    medium: { ar: 'متوسطة', en: 'Medium' },
    expert: { ar: 'متقدمة', en: 'Expert' },
  };

  const getMeterBars = () => {
    switch (difficulty) {
      case 'small':
        return (
          <>
            <div className="w-3 h-3.5 bg-[#1E9E5A] border border-[#12122B] rounded-xs" />
            <div className="w-3 h-3.5 bg-[#E4E4EE] border border-[#12122B] rounded-xs" />
            <div className="w-3 h-3.5 bg-[#E4E4EE] border border-[#12122B] rounded-xs" />
          </>
        );
      case 'medium':
        return (
          <>
            <div className="w-3 h-3.5 bg-[#FFC53D] border border-[#12122B] rounded-xs" />
            <div className="w-3 h-3.5 bg-[#FFC53D] border border-[#12122B] rounded-xs" />
            <div className="w-3 h-3.5 bg-[#E4E4EE] border border-[#12122B] rounded-xs" />
          </>
        );
      case 'expert':
        return (
          <>
            <div className="w-3 h-3.5 bg-[#E5432A] border border-[#12122B] rounded-xs" />
            <div className="w-3 h-3.5 bg-[#E5432A] border border-[#12122B] rounded-xs" />
            <div className="w-3 h-3.5 bg-[#E5432A] border border-[#12122B] rounded-xs" />
          </>
        );
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">{getMeterBars()}</div>
      {showLabel && (
        <span className="text-xs font-semibold text-[#12122B]">
          {labels[difficulty][lang]}
        </span>
      )}
    </div>
  );
};
