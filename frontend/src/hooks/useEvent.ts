import { useEffect, useState } from 'react';
import type { EventSummary } from './useEvents';

export type EventDetail = EventSummary & {
  venue_name: string | null;
  venue_address: string | null;
  venue_capacity: number | null;
};

type EventState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; event: EventDetail };

export function useEvent(eventId: string | undefined): EventState {
  const id = /^\d+$/.test(eventId ?? '') ? Number(eventId) : NaN;
  const validId = Number.isSafeInteger(id) && id > 0 ? id : null;
  const [result, setResult] = useState<{ id: number; state: EventState } | null>(null);

  useEffect(() => {
    const requestedId = validId;
    if (requestedId === null) return;
    const controller = new AbortController();

    const finish = (state: EventState) => {
      if (!controller.signal.aborted) setResult({ id: requestedId, state });
    };

    async function loadEvent() {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/events/${requestedId}`, {
          signal: controller.signal,
        });

        if (response.status === 404) {
          finish({ status: 'not-found' });
          return;
        }
        if (!response.ok) {
          throw new Error(`Could not load the event (HTTP ${response.status}).`);
        }

        const data: { event: EventDetail } | null = await response.json().catch(() => null);
        if (data?.event?.id !== requestedId) {
          throw new Error('The API returned an invalid event response.');
        }
        finish({ status: 'ready', event: data.event });
      } catch (failure) {
        finish({
          status: 'error',
          message: failure instanceof Error ? failure.message : 'Could not load the event.',
        });
      }
    }

    void loadEvent();
    return () => controller.abort();
  }, [validId]);

  if (validId === null) return { status: 'not-found' };
  if (result?.id !== validId) return { status: 'loading' };
  return result.state;
}
