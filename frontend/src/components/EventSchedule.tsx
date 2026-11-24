const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

type EventScheduleProps = {
  startsAt: string;
  endsAt: string;
};

export default function EventSchedule({ startsAt, endsAt }: EventScheduleProps) {
  return (
    <dl className="grid grid-cols-[3rem_1fr] gap-x-2 gap-y-1.5 border-t border-slate-200 pt-4 text-sm">
      <dt className="font-medium text-slate-600">Starts</dt>
      <dd className="font-semibold text-violet-800">
        <time dateTime={startsAt}>
          {dateTimeFormatter.format(new Date(startsAt))}
        </time>
      </dd>
      <dt className="font-medium text-slate-600">Ends</dt>
      <dd className="text-slate-700">
        <time dateTime={endsAt}>
          {dateTimeFormatter.format(new Date(endsAt))}
        </time>
      </dd>
    </dl>
  );
}
