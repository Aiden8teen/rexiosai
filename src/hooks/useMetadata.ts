import { useCallback, useEffect, useRef, useState } from 'react';
import { apiErrorMessage } from '../api/client';
import { getMetadata } from '../api/meta';
import { useApp } from '../context/AppContext';

export function useMetadata() {
  const { lang } = useApp();
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState<unknown>(null);
  const sequence = useRef(0);

  const load = useCallback(async (showLoading: boolean) => {
    const requestSequence = ++sequence.current;
    if (showLoading) {
      setLoading(true);
      setRequestError(null);
    }
    try {
      const result = await getMetadata();
      if (sequence.current === requestSequence) {
        setSkills(result.skills);
        setRequestError(null);
      }
    } catch (requestError) {
      if (sequence.current === requestSequence) {
        setRequestError(requestError);
        setSkills([]);
      }
    } finally {
      if (sequence.current === requestSequence) setLoading(false);
    }
  }, []);

  const retry = useCallback(async () => load(true), [load]);

  useEffect(() => {
    void Promise.resolve().then(() => load(false));
    return () => { sequence.current += 1; };
  }, [load]);

  return { skills, loading, error: requestError ? apiErrorMessage(requestError, lang) : '', retry };
}
