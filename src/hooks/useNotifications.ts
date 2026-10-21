import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { listNotifications, markNotificationRead, type NotificationView } from '../api/notifications';

const PAGE_SIZE = 10;

export function useNotifications(userId: string | null) {
  const [items, setItems] = useState<NotificationView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const itemsRef = useRef<NotificationView[]>([]);
  const identityRef = useRef(userId);
  const refreshSequenceRef = useRef(0);
  const loadMoreSequenceRef = useRef(0);
  const pendingReadsRef = useRef(new Set<string>());

  useLayoutEffect(() => {
    identityRef.current = userId;
    refreshSequenceRef.current++;
    loadMoreSequenceRef.current++;
    pendingReadsRef.current.clear();
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const requestedUserId = userId;
    const sequence = ++refreshSequenceRef.current;
    loadMoreSequenceRef.current++;
    setLoading(true);
    setLoadingMore(false);
    setError('');
    try {
      const result = await listNotifications({ page: 1, limit: PAGE_SIZE });
      if (identityRef.current !== requestedUserId || refreshSequenceRef.current !== sequence) return;
      itemsRef.current = result.items;
      setItems(result.items);
      setUnreadCount(result.unreadCount);
      setTotal(result.total);
      setPage(1);
    } catch (requestError) {
      if (identityRef.current !== requestedUserId || refreshSequenceRef.current !== sequence) return;
      setError(requestError instanceof Error ? requestError.message : 'Could not load notifications.');
    } finally {
      if (identityRef.current === requestedUserId && refreshSequenceRef.current === sequence) setLoading(false);
    }
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (!userId || loadingMore || items.length >= total) return;
    const requestedUserId = userId;
    const requestedPage = page + 1;
    const sequence = ++loadMoreSequenceRef.current;
    setLoadingMore(true);
    setError('');
    try {
      const result = await listNotifications({ page: requestedPage, limit: PAGE_SIZE });
      if (identityRef.current !== requestedUserId || loadMoreSequenceRef.current !== sequence) return;
      const known = new Set(itemsRef.current.map((item) => item.id));
      const nextItems = [...itemsRef.current, ...result.items.filter((item) => !known.has(item.id))];
      itemsRef.current = nextItems;
      setItems(nextItems);
      setUnreadCount(result.unreadCount);
      setTotal(result.total);
      setPage(requestedPage);
    } catch (requestError) {
      if (identityRef.current !== requestedUserId || loadMoreSequenceRef.current !== sequence) return;
      setError(requestError instanceof Error ? requestError.message : 'Could not load more notifications.');
    } finally {
      if (identityRef.current === requestedUserId && loadMoreSequenceRef.current === sequence) setLoadingMore(false);
    }
  }, [items.length, loadingMore, page, total, userId]);

  const markRead = useCallback(async (id: string) => {
    if (!userId) return false;
    const requestedUserId = userId;
    if (pendingReadsRef.current.has(id)) return false;
    pendingReadsRef.current.add(id);
    try {
      const updated = await markNotificationRead(id);
      if (identityRef.current !== requestedUserId) return false;
      const current = itemsRef.current;
      const wasUnread = !current.find((item) => item.id === id)?.readAt;
      const nextItems = current.map((item) => item.id === id ? updated : item);
      itemsRef.current = nextItems;
      setItems(nextItems);
      if (wasUnread && updated.readAt) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      // Invalidate any list request that started before this read committed,
      // then reconcile with the server's current first page and unread count.
      void refresh();
      return true;
    } catch {
      return false;
    } finally {
      pendingReadsRef.current.delete(id);
    }
  }, [refresh, userId]);

  useEffect(() => {
    refreshSequenceRef.current++;
    loadMoreSequenceRef.current++;
    setItems([]);
    itemsRef.current = [];
    setUnreadCount(0);
    setTotal(0);
    setPage(1);
    setError('');
    setLoading(false);
    setLoadingMore(false);
    if (userId) void refresh();
  }, [refresh, userId]);

  useEffect(() => {
    if (!userId) return;
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const onNotificationsRefresh = () => void refresh();
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('rexios:notifications-refresh', onNotificationsRefresh);
    const interval = window.setInterval(refreshWhenVisible, 30_000);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('rexios:notifications-refresh', onNotificationsRefresh);
      window.clearInterval(interval);
    };
  }, [refresh, userId]);

  return { items, unreadCount, loading, loadingMore, error, refresh, loadMore, markRead, hasMore: items.length < total };
}
