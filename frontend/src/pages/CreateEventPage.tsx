import { Link } from 'react-router-dom';
import EventForm from '../components/EventForm';
import { useSaveEvent } from '../hooks/useSaveEvent';

export default function CreateEventPage() {
  const saveEvent = useSaveEvent();

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

        <EventForm onSubmit={(values, signal) => saveEvent({ values }, signal)} />
      </section>
    </div>
  );
}
