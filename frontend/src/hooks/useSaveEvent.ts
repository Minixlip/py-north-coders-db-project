import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export type CreateEventInput = {
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  venue_id: number;
};

export type UpdateEventInput = Partial<
  Omit<CreateEventInput, 'description' | 'venue_id'> & {
    description: string | null;
    venue_id: number | null;
  }
>;

type SaveEventRequest =
  | { eventId?: undefined; values: CreateEventInput }
  | { eventId: number; values: UpdateEventInput };

export function useSaveEvent() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  return async function saveEvent({ eventId, values }: SaveEventRequest, signal: AbortSignal) {
    if (!token) return;

    const isEditing = eventId !== undefined;
    if (isEditing && Object.keys(values).length === 0) {
      navigate(`/events/${eventId}`, { replace: true });
      return;
    }

    const url = isEditing
      ? `http://127.0.0.1:8000/api/events/${eventId}`
      : 'http://127.0.0.1:8000/api/events';
    let response: Response;
    try {
      response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
        signal,
      });
    } catch {
      if (signal.aborted) return;
      throw new Error('Could not reach the API. Check that the server is running.');
    }

    if (signal.aborted) return;
    if (response.status === 401) {
      logout();
      return;
    }

    const data: { detail?: unknown; event?: { id?: unknown } } | null =
      await response.json().catch(() => null);
    if (signal.aborted) return;

    if (!response.ok) {
      const detail = data?.detail;
      const fallback = isEditing ? 'Could not save your changes.' : 'Could not create the event.';
      throw new Error(typeof detail === 'string' ? detail : fallback);
    }

    const id = data?.event?.id;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
      throw new Error('The API did not return the saved event ID.');
    }

    navigate(`/events/${id}`, { replace: true });
  };
}
