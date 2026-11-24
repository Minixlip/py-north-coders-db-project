import { Link, useOutletContext } from 'react-router-dom';
import { useAttendees } from '../hooks/useAttendees';
import type { EventDetail } from '../hooks/useEvent';

export default function AttendeesPage() {
  const event = useOutletContext<EventDetail>();
  const { state, retry } = useAttendees(event.id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        className="mb-5 inline-block font-semibold text-violet-800 underline underline-offset-4"
        to={`/events/${event.id}`}
      >
        Back to event
      </Link>
      <section
        aria-labelledby="attendees-title"
        className="rounded-2xl border border-t-4 border-slate-200 border-t-violet-700 bg-white p-6 shadow-sm sm:p-9"
      >
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" id="attendees-title">
          Attendees
        </h1>
        <p className="mt-2 break-words text-slate-600">{event.title}</p>

        {state.status === 'loading' && <p className="mt-6" role="status">Loading attendees…</p>}
        {state.status === 'error' && (
          <div className="mt-6 space-y-2">
            <p className="text-red-900" role="alert">{state.message}</p>
            <button
              className="min-h-11 font-semibold text-violet-800 underline underline-offset-4"
              onClick={retry}
              type="button"
            >
              Try again
            </button>
          </div>
        )}
        {state.status === 'ready' && (
          state.attendees.length === 0 ? (
            <p className="mt-6 rounded-xl bg-violet-50 px-4 py-3 text-slate-700">No RSVPs yet.</p>
          ) : (
            <table className="mt-6 w-full table-fixed text-left">
              <thead className="bg-violet-50 text-sm text-violet-950">
                <tr>
                  <th className="w-2/5 rounded-l-lg px-3 py-3 font-semibold sm:px-4" scope="col">Name</th>
                  <th className="rounded-r-lg px-3 py-3 font-semibold sm:px-4" scope="col">Email address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {state.attendees.map(({ id, name, email }) => (
                  <tr key={id}>
                    <th className="px-3 py-3 font-medium [overflow-wrap:anywhere] sm:px-4" scope="row">
                      {name}
                    </th>
                    <td className="px-3 py-3 text-slate-600 [overflow-wrap:anywhere] sm:px-4">
                      {email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </section>
    </div>
  );
}
