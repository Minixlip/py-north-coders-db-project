import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { EventDetail } from '../hooks/useEvent';
import type { CreateEventInput, UpdateEventInput } from '../hooks/useSaveEvent';
import { useVenues } from '../hooks/useVenues';

type EventFormProps =
  | {
    event?: undefined;
    onSubmit: (event: CreateEventInput, signal: AbortSignal) => Promise<void>;
  }
  | {
    event: EventDetail;
    onSubmit: (changes: UpdateEventInput, signal: AbortSignal) => Promise<void>;
  };

const emptyForm = { title: '', description: '', startsAt: '', endsAt: '', venueId: '' };
const fieldClass =
  'mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-2 focus-visible:ring-violet-600';

function toLocalInput(date: Date) {
  const wallTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return wallTime.toISOString().slice(0, 16);
}

function parseLocalTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;

  // Check that an invalid date or a daylight-saving gap didn't change the entered time.
  return toLocalInput(date) === value ? date : null;
}

export default function EventForm(props: EventFormProps) {
  const { event: existingEvent } = props;
  const { state, retry } = useVenues();
  const [initialForm] = useState(() => existingEvent ? {
    title: existingEvent.title,
    description: existingEvent.description ?? '',
    startsAt: toLocalInput(new Date(existingEvent.starts_at)),
    endsAt: toLocalInput(new Date(existingEvent.ends_at)),
    venueId: existingEvent.venue_id === null ? '' : String(existingEvent.venue_id),
  } : emptyForm);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  if (state.status === 'loading') {
    return <p className="mt-5" role="status">Loading venues…</p>;
  }
  if (state.status === 'error') {
    return (
      <div className="mt-5 space-y-3">
        <p className="text-red-900" role="alert">{state.message}</p>
        <button className="min-h-11 font-semibold text-violet-800 underline" onClick={retry} type="button">
          Try again
        </button>
      </div>
    );
  }

  const { venues } = state;
  const isEditing = existingEvent !== undefined;
  if (!isEditing && venues.length === 0) {
    return <p className="mt-5 text-slate-600">There are no venues available yet.</p>;
  }

  const currentVenueMissing = existingEvent?.venue_id != null
    && !venues.some(({ id }) => id === existingEvent.venue_id);

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

    const startChanged = !existingEvent || form.startsAt !== initialForm.startsAt;
    const endChanged = !existingEvent || form.endsAt !== initialForm.endsAt;
    const startsAt = existingEvent && !startChanged
      ? new Date(existingEvent.starts_at)
      : parseLocalTime(form.startsAt);
    const endsAt = existingEvent && !endChanged
      ? new Date(existingEvent.ends_at)
      : parseLocalTime(form.endsAt);
    if (!startsAt || !endsAt) {
      setError('Choose valid start and end times in your local time zone.');
      return;
    }
    if ((startChanged || endChanged) && endsAt <= startsAt) {
      setError('The end time must be after the start time.');
      return;
    }

    const venue = venues.find(({ id }) => String(id) === form.venueId);
    const venueChanged = form.venueId !== initialForm.venueId;
    if (!venue && (!isEditing || (venueChanged && form.venueId !== ''))) {
      setError('Choose a venue.');
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    setError('');
    setIsSaving(true);

    try {
      if (props.event) {
        const changes: UpdateEventInput = {};
        if (form.title !== initialForm.title && title !== props.event.title) {
          changes.title = title;
        }
        if (form.description !== initialForm.description) {
          changes.description = form.description || null;
        }
        if (startChanged) changes.starts_at = startsAt.toISOString();
        if (endChanged) changes.ends_at = endsAt.toISOString();
        if (venueChanged) changes.venue_id = venue?.id ?? null;
        await props.onSubmit(changes, controller.signal);
      } else if (venue) {
        await props.onSubmit({
          title,
          description: form.description,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          venue_id: venue.id,
        }, controller.signal);
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof Error ? failure.message : 'Could not save the event.');
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
        Venue {isEditing && <span className="font-normal text-slate-600">(optional)</span>}
        <span className="relative block">
          <select
            className={`${fieldClass} appearance-none pr-10`}
            name="venueId"
            onChange={(event) => updateField('venueId', event.target.value)}
            required={!isEditing}
            value={form.venueId}
          >
            <option value="" disabled={!isEditing}>
              {isEditing ? 'No venue' : 'Choose a venue'}
            </option>
            {currentVenueMissing && (
              <option value={existingEvent.venue_id ?? ''}>
                {existingEvent.venue_name ?? 'Current venue'}
              </option>
            )}
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
        {isEditing
          ? (isSaving ? 'Saving changes…' : 'Save changes')
          : (isSaving ? 'Creating event…' : 'Create event')}
      </button>
    </form>
  );
}
