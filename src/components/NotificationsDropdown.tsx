import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, RefreshCw } from 'lucide-react';
import type { Language } from '../types';
import { useNotifications } from '../hooks/useNotifications';

interface Props { lang: Language; userId: string; }

function relativeTime(value: string, lang: Language): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (lang === 'ar') {
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} د`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} س`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
  }
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const NotificationsDropdown: React.FC<Props> = ({ lang, userId }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const notifications = useNotifications(userId);
  const refreshNotifications = notifications.refresh;

  useEffect(() => {
    if (open) {
      void refreshNotifications();
    }
  }, [open, refreshNotifications]);

  useEffect(() => {
    if (open && !notifications.loading) {
      (firstItemRef.current || panelRef.current)?.focus();
    }
  }, [open, notifications.loading, notifications.items.length]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const onNotificationClick = async (item: (typeof notifications.items)[number]) => {
    await notifications.markRead(item.id);
    const safePath = item.href.startsWith('/') && !item.href.startsWith('//') ? item.href : '/';
    setOpen(false);
    navigate(safePath);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-2 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s hover:bg-[#EFE4CC] cursor-pointer"
        title={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
        aria-label={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="notifications-panel"
      >
        <Bell className="w-4 h-4 text-[#12122B] stroke-[2.2]" />
        {notifications.unreadCount > 0 && <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-[#E5432A] rounded-full border border-[#FFFBF1]" />}
      </button>

      {open && (
        <section ref={panelRef} tabIndex={-1} id="notifications-panel" role="dialog" aria-label={lang === 'ar' ? 'الإشعارات' : 'Notifications'} className="fixed inset-x-3 top-20 sm:absolute sm:inset-x-auto sm:end-0 sm:top-full mt-2 w-auto sm:w-[22rem] max-w-[calc(100vw-1.5rem)] bg-[#FFFBF1] border-2 border-[#12122B] rounded-lg shadow-pixel-m z-50 overflow-hidden outline-none">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b-2 border-[#12122B]">
            <h2 className="font-bold text-sm text-[#12122B]">{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</h2>
            <button type="button" onClick={() => void notifications.refresh()} disabled={notifications.loading} className="p-1 rounded hover:bg-[#EFE4CC] disabled:opacity-50" aria-label={lang === 'ar' ? 'تحديث الإشعارات' : 'Refresh notifications'}>
              <RefreshCw className={`w-3.5 h-3.5 ${notifications.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {notifications.loading && notifications.items.length === 0 ? (
            <p className="p-5 text-center text-xs text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ تحميل الإشعارات…' : 'Loading notifications…'}</p>
          ) : notifications.error && notifications.items.length === 0 ? (
            <div className="p-4 text-center"><p role="alert" className="text-xs text-[#E5432A]">{notifications.error}</p><button type="button" onClick={() => void notifications.refresh()} className="mt-2 text-xs font-bold text-[#0B2A9E] underline">{lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}</button></div>
          ) : notifications.items.length === 0 ? (
            <p className="p-6 text-center text-xs text-[#5B5B7B]">{lang === 'ar' ? 'لا توجد إشعارات بعد.' : 'You have no notifications yet.'}</p>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto" role="list">
                {notifications.items.map((item, index) => (
                  <div key={item.id} role="listitem">
                    <button
                      ref={index === 0 ? firstItemRef : undefined}
                      type="button"
                      onClick={() => void onNotificationClick(item)}
                      className={`w-full text-start px-4 py-3 border-b border-[#EFE4CC] hover:bg-[#F8F1E1] focus-visible:outline-2 focus-visible:outline-[#0B2A9E] ${item.readAt ? '' : 'bg-[#EEF1FF]/70'}`}
                    >
                      <span className="flex items-start gap-2">
                        {!item.readAt && <span className="mt-1.5 w-2 h-2 shrink-0 rounded-full bg-[#E5432A]" />}
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-[#12122B] leading-relaxed">{lang === 'ar' ? item.title : item.titleEn}</span>
                          <span className="block mt-1 text-[10px] text-[#5B5B7B]">{relativeTime(item.createdAt, lang)}</span>
                        </span>
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              {notifications.error && <p role="alert" className="px-4 pt-2 text-xs text-[#E5432A]">{notifications.error}</p>}
              {notifications.hasMore && <button type="button" disabled={notifications.loadingMore} onClick={() => void notifications.loadMore()} className="w-full px-4 py-3 text-xs font-bold text-[#0B2A9E] hover:bg-[#EFE4CC] disabled:opacity-50">{notifications.loadingMore ? (lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…') : (lang === 'ar' ? 'تحميل المزيد' : 'Load more')}</button>}
            </>
          )}
        </section>
      )}
    </div>
  );
};
