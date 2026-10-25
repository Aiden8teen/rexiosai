import { useEffect, useRef, useState } from 'react';
import { nextWordPrefix } from '../utils/smoothWords';

/** A single text node preserves Arabic shaping and native selection/copying. */
export function SmoothText({ text, streaming }: { text: string; streaming: boolean }) {
  const [visible, setVisible] = useState('');
  const shown = useRef('');

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let previous = 0;
    const received = performance.now();
    const tick = (now: number) => {
      if (now - previous < 25) { frame = requestAnimationFrame(tick); return; }
      previous = now;
      const immediate = !streaming || motion.matches || document.hidden;
      const current = text.startsWith(shown.current) ? shown.current : '';
      // Catch large bursts up quickly; never add a typing delay after validation.
      const words = Math.max(1, Math.ceil((text.length - current.length) / 100));
      shown.current = nextWordPrefix(current, text, immediate ? Infinity : words, immediate || now - received > 120);
      setVisible(shown.current);
      if (shown.current !== text) frame = requestAnimationFrame(tick);
    };
    const flush = () => {
      if (motion.matches || document.hidden) {
        cancelAnimationFrame(frame);
        shown.current = text;
        setVisible(text);
      }
    };
    frame = requestAnimationFrame(tick);
    motion.addEventListener('change', flush);
    document.addEventListener('visibilitychange', flush);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener('change', flush);
      document.removeEventListener('visibilitychange', flush);
    };
  }, [text, streaming]);

  // Validation, cancellation and replacement never leave stale provisional text.
  return !streaming ? text : text.startsWith(visible) ? visible : '';
}
