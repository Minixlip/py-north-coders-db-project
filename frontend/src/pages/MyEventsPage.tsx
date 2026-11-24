import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { useMyEvents } from '../hooks/useMyEvents';

export default function MyEventsPage() {
  const { events, isLoading, error } = useMyEvents();

  return (
    <section aria-labelledby="my-events-title">
      <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl" id="my-events-title">
        My Events
      </h1>

      {isLoading && <p role="status">Loading your events…</p>}
      {error && <p className="text-red-900" role="alert">{error}</p>}

      {!isLoading && !error && events.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">No events found</h2>
          <p className="mt-2 text-slate-600">
            You haven’t RSVPed to any events yet. Would you like to see what’s on?
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-violet-700 px-4 font-semibold text-white hover:bg-violet-800"
            to="/events"
          >
            Browse events
          </Link>
        </div>
      )}

      {events.length > 0 && (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <li className="min-w-0" key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
