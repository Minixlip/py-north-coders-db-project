import { Link, useNavigate } from 'react-router-dom';
import EventForm, { type CreateEventInput } from '../components/EventForm';
import { useAuth } from '../context/AuthContext';
import { useVenues } from '../hooks/useVenues';

export default function CreateEventPage() {
  const { token, logout } = useAuth();
  const { state, retry } = useVenues();
  const navigate = useNavigate();

  async function createEvent(event: CreateEventInput, signal: AbortSignal) {
    if (!token) return;

    let response: Response;
    try {
      response = await fetch('http://127.0.0.1:8000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(event),
        signal,
      });
    } catch {
      if (signal.aborted) return;
      throw new Error('Could not reach the API. Check that the server is running.');
    }

    if (signal.aborted) return;
    if (response.status === 401) {
      logout();
      return;
    }

    const data: { detail?: unknown; event?: { id?: unknown } } | null =
      await response.json().catch(() => null);
    if (signal.aborted) return;

    if (!response.ok) {
      const detail = data?.detail;
      throw new Error(typeof detail === 'string' ? detail : 'Could not create the event.');
    }

    const id = data?.event?.id;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
      throw new Error('The API did not return the new event ID.');
    }

    navigate(`/events/${id}`, { replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        className="mb-5 inline-block font-semibold text-violet-800 underline underline-offset-4"
        to="/events"
      >
        Back to events
      </Link>
      <section
        aria-labelledby="create-event-title"
        className="rounded-2xl border border-t-4 border-slate-200 border-t-violet-700 bg-white p-6 shadow-sm sm:p-9"
      >
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" id="create-event-title">
          Create event
        </h1>

        {state.status === 'loading' && <p className="mt-5" role="status">Loading venues…</p>}
        {state.status === 'error' && (
          <div className="mt-5 space-y-3">
            <p className="text-red-900" role="alert">{state.message}</p>
            <button className="min-h-11 font-semibold text-violet-800 underline" onClick={retry} type="button">
              Try again
            </button>
          </div>
        )}
        {state.status === 'ready' && (
          state.venues.length > 0
            ? <EventForm venues={state.venues} onSubmit={createEvent} />
            : <p className="mt-5 text-slate-600">There are no venues available yet.</p>
        )}
      </section>
    </div>
  );
}
