import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMyEvents } from '../hooks/useMyEvents';

const buttonClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg px-4 font-semibold disabled:cursor-wait disabled:opacity-70';
const primaryButton = `${buttonClass} bg-violet-700 text-white hover:bg-violet-800`;
const secondaryButton = `${buttonClass} border border-slate-300 text-slate-800 hover:bg-slate-50`;

type RsvpNotice = {
  kind: 'success' | 'error';
  message: string;
};

export default function EventRsvp({ eventId }: { eventId: number }) {
  const { token } = useAuth();
  const { pathname, search, hash } = useLocation();
  const next = encodeURIComponent(pathname + search + hash);

  return (
    <section className="mt-7 border-t border-slate-200 pt-5" aria-labelledby="rsvp-title">
      <h2 className="mb-3 text-lg font-semibold" id="rsvp-title">RSVP</h2>
      {token ? (
        <RsvpControls
          key={`${eventId}:${token}`}
          eventId={eventId}
          token={token}
        />
      ) : (
        <Link className={primaryButton} to={`/login?next=${next}`}>
          Log in to RSVP
        </Link>
      )}
    </section>
  );
}

function RsvpControls({ eventId, token }: { eventId: number; token: string }) {
  const { logout } = useAuth();
  const { events, isLoading, error, refresh } = useMyEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<RsvpNotice | null>(null);
  const request = useRef<AbortController | null>(null);
  const hasRsvped = events.some((event) => event.id === eventId);

  useEffect(() => () => request.current?.abort(), []);

  async function updateRsvp() {
    if (request.current || isLoading || error) return;

    const controller = new AbortController();
    request.current = controller;
    setIsSubmitting(true);
    setNotice(null);

    const url = `http://127.0.0.1:8000/api/events/${eventId}/rsvp`;
    const failureMessage = hasRsvped ? 'Could not cancel your RSVP.' : 'Could not RSVP to this event.';

    try {
      const response = await fetch(hasRsvped ? `${url}/me` : url, {
        method: hasRsvped ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        const data: { detail?: unknown } | null = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        setNotice({
          kind: 'error',
          message: typeof data?.detail === 'string' ? data.detail : failureMessage,
        });

        if ((!hasRsvped && response.status === 409) || (hasRsvped && response.status === 404)) {
          refresh();
        }
        return;
      }

      setNotice({ kind: 'success', message: hasRsvped ? 'RSVP cancelled.' : 'RSVP confirmed.' });
      refresh();
    } catch {
      if (controller.signal.aborted) return;
      setNotice({ kind: 'error', message: failureMessage });
      refresh();
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setIsSubmitting(false);
      }
    }
  }

  let actionLabel = hasRsvped ? 'Cancel RSVP' : 'RSVP';
  if (isSubmitting) actionLabel = hasRsvped ? 'Cancelling…' : 'Saving RSVP…';
  else if (isLoading) actionLabel = 'Checking your RSVP…';

  return (
    <div className="space-y-3">
      {notice && (
        <p
          className={notice.kind === 'success' ? 'text-emerald-800' : 'text-red-900'}
          role={notice.kind === 'success' ? 'status' : 'alert'}
        >
          {notice.message}
        </p>
      )}
      {error ? (
        <>
          <p className="text-red-900" role="alert">{error}</p>
          <button className={secondaryButton} onClick={refresh} type="button">Try again</button>
        </>
      ) : (
        <button
          className={hasRsvped ? secondaryButton : primaryButton}
          disabled={isLoading || isSubmitting}
          onClick={updateRsvp}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
