import { useState, type FormEvent } from 'react';
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputClass =
  'mt-2 block min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-2 focus-visible:ring-violet-600';

const returnPaths = ['/my-events', '/events/new', '/events/:eventId/edit', '/events/:eventId/attendees'];

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { search } = useLocation();
  const navigate = useNavigate();
  const next = new URLSearchParams(search).get('next');
  const nextPath = next?.split(/[?#]/, 1)[0];
  const returnTo = next && nextPath && returnPaths.some((path) => matchPath(path, nextPath))
    ? next
    : '/events';

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    try {
      await login(formData.email.trim(), formData.password);
      navigate(returnTo, { replace: true });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to log in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-10 sm:py-16">
      <section
        aria-labelledby="login-title"
        className="mx-auto w-full max-w-md rounded-2xl border border-t-4 border-slate-200 border-t-violet-700 bg-white p-6 shadow-sm sm:p-9"
      >
        <h1
          className="text-3xl font-bold tracking-tight text-slate-950"
          id="login-title"
        >
          Log in to Eventsy
        </h1>

        <form
          className="mt-7 grid gap-5"
          onSubmit={handleLogin}
        >
          <label className="block text-sm font-semibold">
            Email address
            <input
              autoComplete="username"
              className={inputClass}
              name="email"
              onChange={({ target: { value } }) =>
                setFormData((previous) => ({ ...previous, email: value }))
              }
              required
              type="email"
              value={formData.email}
            />
          </label>

          <label className="block text-sm font-semibold">
            Password
            <input
              autoComplete="current-password"
              className={inputClass}
              name="password"
              onChange={({ target: { value } }) =>
                setFormData((previous) => ({ ...previous, password: value }))
              }
              required
              type="password"
              value={formData.password}
            />
          </label>

          {error && (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="min-h-11 rounded-lg bg-violet-700 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-violet-800 disabled:cursor-wait disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-600">
          New to Eventsy?{' '}
          <Link
            className="font-semibold text-violet-800 underline underline-offset-4"
            to={{ pathname: '/register', search }}
          >
            Create an account
          </Link>
        </p>
      </section>
    </div>
  );
}
