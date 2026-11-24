import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { VenueOption } from '../hooks/useVenues';

export type CreateEventInput = {
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  venue_id: number;
};

type EventFormProps = {
  venues: VenueOption[];
  onSubmit: (event: CreateEventInput, signal: AbortSignal) => Promise<void>;
};

const emptyForm = { title: '', description: '', startsAt: '', endsAt: '', venueId: '' };
const fieldClass =
  'mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-2 focus-visible:ring-violet-600';

function parseLocalTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;

  // Check that an invalid date or a daylight-saving gap didn't change the entered time.
  const wallTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return wallTime.toISOString().slice(0, 16) === value ? date : null;
}

export default function EventForm({ venues, onSubmit }: EventFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current) return;

    const title = form.title.trim();
    if (!title) {
      setError('Enter an event title.');
      return;
    }

    const startsAt = parseLocalTime(form.startsAt);
    const endsAt = parseLocalTime(form.endsAt);
    if (!startsAt || !endsAt) {
      setError('Choose valid start and end times in your local time zone.');
      return;
    }
    if (endsAt <= startsAt) {
      setError('The end time must be after the start time.');
      return;
    }

    const venue = venues.find(({ id }) => String(id) === form.venueId);
    if (!venue) {
      setError('Choose a venue.');
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    setError('');
    setIsSaving(true);

    try {
      await onSubmit({
        title,
        description: form.description,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        venue_id: venue.id,
      }, controller.signal);
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof Error ? failure.message : 'Could not create the event.');
      }
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setIsSaving(false);
      }
    }
  }

  return (
    <form className="mt-7 grid gap-5" onSubmit={handleSubmit}>
      <label className="block text-sm font-semibold">
        Event title
        <input
          className={fieldClass}
          maxLength={255}
          name="title"
          onChange={(event) => updateField('title', event.target.value)}
          required
          value={form.title}
        />
      </label>

      <label className="block text-sm font-semibold">
        Description <span className="font-normal text-slate-600">(optional)</span>
        <textarea
          className={fieldClass}
          maxLength={255}
          name="description"
          onChange={(event) => updateField('description', event.target.value)}
          rows={3}
          value={form.description}
        />
      </label>

      <fieldset className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 pb-4">
        <legend className="px-1 text-sm font-semibold">Schedule</legend>
        <p className="mt-1 text-sm text-slate-600" id="event-time-help">
          Times are in your device’s time zone.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block min-w-0 text-sm font-semibold">
            Starts at
            <input
              aria-describedby="event-time-help"
              className={fieldClass}
              name="startsAt"
              onChange={(event) => updateField('startsAt', event.target.value)}
              required
              type="datetime-local"
              value={form.startsAt}
            />
          </label>
          <label className="block min-w-0 text-sm font-semibold">
            Ends at
            <input
              aria-describedby="event-time-help"
              className={fieldClass}
              name="endsAt"
              onChange={(event) => updateField('endsAt', event.target.value)}
              required
              type="datetime-local"
              value={form.endsAt}
            />
          </label>
        </div>
      </fieldset>

      <label className="block text-sm font-semibold">
        Venue
        <span className="relative block">
          <select
            className={`${fieldClass} appearance-none pr-10`}
            name="venueId"
            onChange={(event) => updateField('venueId', event.target.value)}
            required
            value={form.venueId}
          >
            <option value="" disabled>Choose a venue</option>
            {venues.map(({ id, name, address }) => (
              <option key={id} value={id}>
                {address ? `${name} — ${address}` : name}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 size-2 -translate-y-3/4 rotate-45 border-r-2 border-b-2 border-slate-500"
          />
        </span>
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">{error}</p>
      )}
      <button
        className="min-h-11 rounded-lg bg-violet-700 px-4 py-2.5 font-semibold text-white hover:bg-violet-800 disabled:cursor-wait disabled:opacity-70 sm:justify-self-start"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? 'Creating event…' : 'Create event'}
      </button>
    </form>
  );
}
