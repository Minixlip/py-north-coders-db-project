import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { EventSummary } from './useEvents';

type MyEvent = Pick<EventSummary, 'id' | 'title' | 'starts_at'> & {
  rsvp_date: string | null;
  event_rank: number;
  total_rsvps: number;
};

type MyEventsResult = {
  token: string;
  requestVersion: number;
  events: MyEvent[];
  error: string | null;
};

export function useMyEvents() {
  const { token, logout } = useAuth();
  const [result, setResult] = useState<MyEventsResult | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const requestToken = token;
    if (!requestToken) return;
    const controller = new AbortController();

    const finish = (events: MyEvent[], error: string | null = null) => {
      if (!controller.signal.aborted) {
        setResult({ token: requestToken, requestVersion, events, error });
      }
    };

    async function loadMyEvents() {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/user/me/events', {
          headers: { Authorization: `Bearer ${requestToken}` },
          signal: controller.signal,
        });

        if (response.status === 401) {
          if (!controller.signal.aborted) logout();
          return;
        }

        if (!response.ok) {
          throw new Error(`Could not load your events (HTTP ${response.status}).`);
        }

        const data: { events: MyEvent[] } | null = await response.json().catch(() => null);
        if (!Array.isArray(data?.events)) {
          throw new Error('The API returned an invalid events response.');
        }

        finish(data.events);
      } catch (failure) {
        finish([], failure instanceof Error ? failure.message : 'Could not load your events.');
      }
    }

    void loadMyEvents();
    return () => controller.abort();
  }, [token, requestVersion, logout]);

  const current = result?.token === token && result.requestVersion === requestVersion
    ? result
    : null;

  function refresh() {
    setRequestVersion((version) => version + 1);
  }

  return {
    events: current?.events ?? [],
    isLoading: Boolean(token) && !current,
    error: current?.error ?? null,
    refresh,
  };
}
