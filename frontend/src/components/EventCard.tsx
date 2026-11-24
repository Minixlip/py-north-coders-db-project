import { Link } from 'react-router-dom';
import EventSchedule from './EventSchedule';
import type { EventSummary } from '../hooks/useEvents';

type EventCardProps = {
  event: Pick<EventSummary, 'id' | 'title' | 'starts_at'>
    & Partial<Pick<EventSummary, 'description' | 'ends_at'>>;
};

export default function EventCard({ event }: EventCardProps) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-t-4 border-slate-200 border-t-violet-700 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold tracking-tight break-words text-slate-950">
        <Link
          className="text-violet-900 underline decoration-violet-300 underline-offset-4 hover:decoration-violet-900 focus-visible:decoration-violet-900"
          to={`/events/${event.id}`}
        >
          {event.title}
        </Link>
      </h2>

      {event.description && (
        <p className="mt-3 leading-relaxed break-words text-slate-600">
          {event.description}
        </p>
      )}

      <div className="mt-auto pt-5">
        <EventSchedule
          startsAt={event.starts_at}
          endsAt={event.ends_at}
        />
      </div>
    </article>
  );
}
