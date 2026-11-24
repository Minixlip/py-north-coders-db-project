import { Link, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../hooks/useEvent';

export default function OrganiserRoutes() {
  const { eventId } = useParams();
  const { userId } = useAuth();
  const result = useEvent(eventId);

  if (result.status === 'loading') return <p role="status">Loading event…</p>;

  if (result.status === 'not-found') {
    return <h1 className="text-3xl font-bold tracking-tight">Event not found</h1>;
  }

  if (result.status === 'error') {
    return <p className="text-red-900" role="alert">{result.message}</p>;
  }

  if (userId !== null && result.event.organiser_id === userId) {
    return <Outlet context={result.event} />;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h1 className="text-3xl font-bold tracking-tight">Access denied</h1>
      <p className="mt-3 text-slate-600">Only the event organiser can access this page.</p>
      <Link
        className="mt-4 inline-block font-semibold text-violet-800 underline"
        to={`/events/${result.event.id}`}
      >
        Back to event
      </Link>
    </section>
  );
}
