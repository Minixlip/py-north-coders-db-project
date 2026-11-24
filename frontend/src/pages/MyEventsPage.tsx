import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useMyEvents } from '../hooks/useMyEvents';

type EventGroupProps = {
  title: string;
  headingId: string;
  events: ComponentProps<typeof EventCard>['event'][];
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  children: ReactNode;
};

function EventGroup({ title, headingId, events, isLoading, loadingMessage, error, children }: EventGroupProps) {
  return (
    <section aria-labelledby={headingId}>
      <h2 className="mb-4 text-2xl font-bold tracking-tight" id={headingId}>{title}</h2>
      {isLoading && <p role="status">{loadingMessage}</p>}
      {error && <p className="text-red-900" role="alert">{error}</p>}

      {!isLoading && !error && events.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
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

const emptyStateLink =
  'mt-5 inline-flex min-h-11 items-center rounded-lg bg-violet-700 px-4 font-semibold text-white hover:bg-violet-800';

export default function MyEventsPage() {
  const { userId } = useAuth();
  const allEvents = useEvents();
  const rsvps = useMyEvents();
  const hostedEvents = userId === null
    ? []
    : allEvents.events.filter((event) => event.organiser_id === userId);

  return (
    <section aria-labelledby="my-events-title">
      <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl" id="my-events-title">
        My Events
      </h1>

      <div className="space-y-9">
        <EventGroup
          title="Hosting"
          headingId="hosting-title"
          events={hostedEvents}
          isLoading={allEvents.isLoading}
          loadingMessage="Loading events you host…"
          error={allEvents.error}
        >
          <h3 className="text-xl font-semibold">No hosted events yet</h3>
          <Link className={emptyStateLink} to="/events/new">
            Create an event
          </Link>
        </EventGroup>

        <EventGroup
          title="RSVPs"
          headingId="rsvps-title"
          events={rsvps.events}
          isLoading={rsvps.isLoading}
          loadingMessage="Loading your RSVPs…"
          error={rsvps.error}
        >
          <h3 className="text-xl font-semibold">No events found</h3>
          <p className="mt-2 text-slate-600">
            You haven’t RSVPed to any events yet. Would you like to see what’s on?
          </p>
          <Link className={emptyStateLink} to="/events">
            Browse events
          </Link>
        </EventGroup>
      </div>
    </section>
  );
}
