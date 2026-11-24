import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

type Attendee = {
  id: number;
  name: string;
  email: string;
};

type AttendeesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; attendees: Attendee[] };

type AttendeesResult = {
  eventId: number;
  token: string;
  attempt: number;
  state: AttendeesState;
};

export function useAttendees(eventId: number) {
  const { token, logout } = useAuth();
  const [result, setResult] = useState<AttendeesResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const requestToken = token;
    if (!requestToken) return;
    const controller = new AbortController();

    const finish = (state: AttendeesState) => {
      if (!controller.signal.aborted) {
        setResult({ eventId, token: requestToken, attempt, state });
      }
    };

    async function loadAttendees() {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/events/${eventId}/attendees`, {
          headers: { Authorization: `Bearer ${requestToken}` },
          signal: controller.signal,
        });

        if (response.status === 401) {
          if (!controller.signal.aborted) logout();
          return;
        }

        const data: { attendees?: Attendee[]; detail?: unknown } | null =
          await response.json().catch(() => null);

        if (!response.ok) {
          const detail = data?.detail;
          throw new Error(typeof detail === 'string' ? detail : 'Could not load attendees.');
        }
        if (!Array.isArray(data?.attendees)) {
          throw new Error('The API returned an invalid attendees response.');
        }

        finish({ status: 'ready', attendees: data.attendees });
      } catch (failure) {
        finish({
          status: 'error',
          message: failure instanceof Error ? failure.message : 'Could not load attendees.',
        });
      }
    }

    void loadAttendees();
    return () => controller.abort();
  }, [eventId, token, attempt, logout]);

  const state: AttendeesState =
    result?.eventId === eventId && result.token === token && result.attempt === attempt
      ? result.state
      : { status: 'loading' };

  function retry() {
    setAttempt((previous) => previous + 1);
  }

  return { state, retry };
}
