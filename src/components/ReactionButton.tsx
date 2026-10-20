import React from 'react';
import { useApp } from '../context/AppContext';
import { Lightbulb, ThumbsUp } from 'lucide-react';

interface ReactionButtonProps {
  type: 'helpful' | 'insight';
  count: number;
  onClick: () => void;
  className?: string;
}

export const ReactionButton: React.FC<ReactionButtonProps> = ({
  type,
  count,
  onClick,
  className = '',
}) => {
  const { lang } = useApp();

  const labels = {
    helpful: { ar: 'مفيد', en: 'Helpful' },
    insight: { ar: 'إضاءة', en: 'Insight' },
  };

  const Icon = type === 'helpful' ? ThumbsUp : Lightbulb;
  const activeColor =
    type === 'helpful'
      ? 'hover:bg-[#F0FFC4] hover:border-[#8FCC00]'
      : 'hover:bg-[#FFF1CC] hover:border-[#FFC53D]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFFBF1] border-2 border-[#12122B] rounded-full text-xs font-semibold text-[#12122B] shadow-pixel-s transition-all active:translate-y-0.5 ${activeColor} cursor-pointer ${className}`}
    >
      <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
      <span>{labels[type][lang]}</span>
      <span className="bg-[#E4E4EE] px-1.5 py-0.2 rounded-full text-[11px] font-bold">
        {count}
      </span>
    </button>
  );
};
