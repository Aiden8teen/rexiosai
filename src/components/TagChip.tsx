import React from 'react';

interface TagChipProps {
  tag: string;
  isMatched?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const TagChip: React.FC<TagChipProps> = ({
  tag,
  isMatched = false,
  selected = false,
  onClick,
  onRemove,
  className = '',
  size = 'md',
}) => {
  const isInteractive = Boolean(onClick || onRemove);

  let bgStyles = 'bg-[#FFFBF1] text-[#12122B] border-[#12122B]';
  if (isMatched) {
    bgStyles = 'bg-[#C6FF3D] text-[#12122B] border-[#12122B] font-bold shadow-pixel-s';
  } else if (selected) {
    bgStyles = 'bg-[#0B2A9E] text-[#FFFBF1] border-[#12122B]';
  }

  const sizeStyles =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : 'px-2.5 py-1 text-xs';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-tag uppercase tracking-wider border-2 rounded-full select-none transition-all ${sizeStyles} ${bgStyles} ${
        isInteractive ? 'cursor-pointer hover:brightness-95 active:scale-95' : ''
      } ${className}`}
    >
      <span>{tag}</span>
      {isMatched && <span className="text-[10px]">✔</span>}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-[#E5432A] cursor-pointer"
        >
          ✕
        </button>
      )}
    </span>
  );
};
