import { Link } from 'react-router-dom';

const inputClass =
  'mt-2 block min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-2 focus-visible:ring-violet-600';

export default function Register() {
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

        <div className="mt-7 grid gap-5">
          <label className="block text-sm font-semibold">
            Name
            <input
              autoComplete="name"
              className={inputClass}
              name="name"
              type="text"
            />
          </label>

          <label className="block text-sm font-semibold">
            Email address
            <input
              autoComplete="email"
              className={inputClass}
              name="email"
              type="email"
            />
          </label>

          <label className="block text-sm font-semibold">
            Password
            <input
              autoComplete="new-password"
              className={inputClass}
              name="password"
              type="password"
            />
          </label>

          <button
            className="min-h-11 rounded-lg bg-violet-700 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-violet-800"
            type="button"
          >
            Create account
          </button>
        </div>

        <p className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-600">
          Already have an account?{' '}
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
