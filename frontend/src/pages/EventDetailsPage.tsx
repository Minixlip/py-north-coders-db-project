import { Link, useParams } from 'react-router-dom';
import EventRsvp from '../components/EventRsvp';
import EventSchedule from '../components/EventSchedule';
import { useEvent, type EventDetail } from '../hooks/useEvent';

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const result = useEvent(eventId);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        className="mb-5 inline-block font-semibold text-violet-800 underline underline-offset-4"
        to="/events"
      >
        Back to events
      </Link>

      {result.status === 'loading' && <p role="status">Loading event…</p>}
      {result.status === 'not-found' && (
        <h1 className="text-3xl font-bold tracking-tight">Event not found</h1>
      )}
      {result.status === 'error' && (
        <p className="text-red-900" role="alert">{result.message}</p>
      )}
      {result.status === 'ready' && <EventDetails event={result.event} />}
    </div>
  );
}

function EventDetails({ event }: { event: EventDetail }) {
  const { title, description, starts_at, ends_at, venue_name, venue_address, venue_capacity } = event;
  const hasVenue = Boolean(venue_name || venue_address) || venue_capacity !== null;

  return (
    <article className="rounded-2xl border border-t-4 border-slate-200 border-t-violet-700 bg-white p-6 shadow-sm sm:p-9">
      <h1 className="text-3xl font-bold tracking-tight break-words sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-4 leading-relaxed break-words whitespace-pre-line text-slate-600">
          {description}
        </p>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl bg-violet-50 p-4 sm:p-5" aria-labelledby="schedule-title">
          <h2 className="mb-3 text-lg font-semibold" id="schedule-title">Schedule</h2>
          <EventSchedule
            startsAt={starts_at}
            endsAt={ends_at}
          />
        </section>
        <section className="rounded-xl border border-slate-200 p-4 sm:p-5" aria-labelledby="venue-title">
          <h2 className="mb-3 text-lg font-semibold" id="venue-title">Venue</h2>
          {hasVenue ? (
            <div className="space-y-1.5 break-words text-slate-700">
              {venue_name && <p className="font-semibold text-slate-950">{venue_name}</p>}
              {venue_address && <p className="whitespace-pre-line">{venue_address}</p>}
              {venue_capacity !== null && (
                <dl className="flex flex-wrap gap-x-2 pt-2 text-sm">
                  <dt className="font-medium">Capacity</dt>
                  <dd>{venue_capacity}</dd>
                </dl>
              )}
            </div>
          ) : (
            <p className="text-slate-600">Venue not set.</p>
          )}
        </section>
      </div>
      <EventRsvp eventId={event.id} />
    </article>
  );
}
