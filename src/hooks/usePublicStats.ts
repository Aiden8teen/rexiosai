import { useCallback, useEffect, useState } from 'react';
import { getPublicStats, type PublicStats } from '../api/public';

export function usePublicStats() {
  const [data, setData] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const retry = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getPublicStats());
    } catch (requestError) {
      setData(null);
      setError(requestError instanceof Error ? requestError.message : 'Could not load statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void retry(); }, [retry]);
  return { data, loading, error, retry };
}
