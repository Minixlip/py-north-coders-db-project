import type { EventSummary } from '../hooks/useEvents';

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

type EventCardProps = {
  event: EventSummary;
};

export default function EventCard({ event }: EventCardProps) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-t-4 border-slate-200 border-t-violet-700 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold tracking-tight break-words text-slate-950">
        {event.title}
      </h2>

      {event.description && (
        <p className="mt-3 leading-relaxed break-words text-slate-600">
          {event.description}
        </p>
      )}

      <div className="mt-auto pt-5">
        <dl className="grid grid-cols-[3rem_1fr] gap-x-2 gap-y-1.5 border-t border-slate-200 pt-4 text-sm">
          <dt className="font-medium text-slate-600">Starts</dt>
          <dd className="font-semibold text-violet-800">
            <time dateTime={event.starts_at}>
              {dateTimeFormatter.format(new Date(event.starts_at))}
            </time>
          </dd>
          <dt className="font-medium text-slate-600">Ends</dt>
          <dd className="text-slate-700">
            <time dateTime={event.ends_at}>
              {dateTimeFormatter.format(new Date(event.ends_at))}
            </time>
          </dd>
        </dl>
      </div>
    </article>
  );
}
