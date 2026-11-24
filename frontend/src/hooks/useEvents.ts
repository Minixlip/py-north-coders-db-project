import { useEffect, useState } from 'react';

export type EventSummary = {
  id: number;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  organiser_id: number | null;
  venue_id: number | null;
  created_at: string | null;
};

type EventsResponse = {
  events: EventSummary[];
};

export function useEvents() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/events', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Could not load events (HTTP ${response.status}).`);
        }

        const data: EventsResponse | null = await response.json().catch(() => null);
        if (!Array.isArray(data?.events)) {
          throw new Error('The API returned an invalid events response.');
        }

        if (!controller.signal.aborted) setEvents(data.events);
      } catch (failure) {
        if (controller.signal.aborted) return;
        setError(failure instanceof Error ? failure.message : 'Could not load events.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadEvents();

    return () => controller.abort();
  }, []);

  return { events, isLoading, error };
}
