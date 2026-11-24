import { useEffect, useState } from 'react';

export type VenueOption = {
  id: number;
  name: string;
  address: string | null;
};

type VenuesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; venues: VenueOption[] };

export function useVenues() {
  const [state, setState] = useState<VenuesState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadVenues() {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/venues', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Could not load venues (HTTP ${response.status}).`);
        }

        const data: { venues: VenueOption[] } | null = await response.json().catch(() => null);
        if (!Array.isArray(data?.venues)) {
          throw new Error('The API returned an invalid venues response.');
        }

        if (!controller.signal.aborted) setState({ status: 'ready', venues: data.venues });
      } catch (failure) {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          message: failure instanceof Error ? failure.message : 'Could not load venues.',
        });
      }
    }

    void loadVenues();
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setState({ status: 'loading' });
    setAttempt((previous) => previous + 1);
  }

  return { state, retry };
}
