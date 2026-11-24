import { Link, useOutletContext } from 'react-router-dom';
import EventForm from '../components/EventForm';
import type { EventDetail } from '../hooks/useEvent';
import { useSaveEvent } from '../hooks/useSaveEvent';

export default function EditEventPage() {
  const event = useOutletContext<EventDetail>();
  const saveEvent = useSaveEvent();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        className="mb-5 inline-block font-semibold text-violet-800 underline underline-offset-4"
        to={`/events/${event.id}`}
      >
        Back to event
      </Link>
      <section
        aria-labelledby="edit-event-title"
        className="rounded-2xl border border-t-4 border-slate-200 border-t-violet-700 bg-white p-6 shadow-sm sm:p-9"
      >
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" id="edit-event-title">
          Edit event
        </h1>
        <EventForm
          key={event.id}
          event={event}
          onSubmit={(values, signal) => saveEvent({ eventId: event.id, values }, signal)}
        />
      </section>
    </div>
  );
}
