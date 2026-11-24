import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputClass =
  'mt-2 block min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-2 focus-visible:ring-violet-600';

const emptyForm = { name: '', email: '', password: '' };

export default function Register() {
  const { register } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [status, setStatus] = useState<'idle' | 'pending' | 'registered'>('idle');
  const [error, setError] = useState('');

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status !== 'idle') return;

    const name = formData.name.trim();
    if (!name) {
      setError('Enter your name.');
      return;
    }

    setError('');
    setStatus('pending');

    try {
      await register({ name, email: formData.email.trim(), password: formData.password });
      setFormData(emptyForm);
      setStatus('registered');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to create your account.');
      setStatus('idle');
    }
  }

  return (
    <div className="px-4 py-10 sm:py-16">
      <section
        aria-labelledby="register-title"
        className="mx-auto w-full max-w-md rounded-2xl border border-t-4 border-slate-200 border-t-violet-700 bg-white p-6 shadow-sm sm:p-9"
      >
        <h1
          className="text-3xl font-bold tracking-tight text-slate-950"
          id="register-title"
        >
          Create an account
        </h1>

        {status === 'registered' ? (
          <p
            className="mt-7 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900"
            role="status"
          >
            Your account is ready. Log in to continue.
          </p>
        ) : (
          <form
            className="mt-7 grid gap-5"
            onSubmit={handleRegister}
          >
            <label className="block text-sm font-semibold">
              Name
              <input
                autoComplete="name"
                className={inputClass}
                maxLength={255}
                name="name"
                onChange={({ target: { value } }) =>
                  setFormData((previous) => ({ ...previous, name: value }))
                }
                required
                type="text"
                value={formData.name}
              />
            </label>

            <label className="block text-sm font-semibold">
              Email address
              <input
                autoComplete="email"
                className={inputClass}
                maxLength={255}
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
                autoComplete="new-password"
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
              disabled={status === 'pending'}
              type="submit"
            >
              {status === 'pending' ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        <p className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-600">
          {status !== 'registered' && 'Already have an account? '}
          <Link
            className="font-semibold text-violet-800 underline underline-offset-4"
            to="/login"
          >
            Log in
          </Link>
        </p>
      </section>
    </div>
  );
}
