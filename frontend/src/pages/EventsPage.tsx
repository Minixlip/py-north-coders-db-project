import EventCard from '../components/EventCard';
import { useEvents } from '../hooks/useEvents';

export default function EventsPage() {
  const { events, isLoading, error } = useEvents();

  return (
    <section aria-labelledby="events-title">
      <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl" id="events-title">
        Events
      </h1>

      {isLoading && <p role="status">Loading events…</p>}
      {error && <p className="text-red-900" role="alert">{error}</p>}
      {!isLoading && !error && events.length === 0 && <p>No events yet.</p>}

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
