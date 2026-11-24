import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { loadSession, saveSession } from './auth.js';
import SiteHeader from './components/SiteHeader.jsx';
import AuthPage from './pages/AuthPage.jsx';
import CreateEventPage from './pages/CreateEventPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import HomePage from './pages/HomePage.js';
import MyEventsPage from './pages/MyEventsPage.jsx';

function NotFoundPage() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <Link
        className="mt-4 inline-block font-semibold text-violet-800 underline"
        to="/"
      >
        Back to home
      </Link>
    </section>
  );
}

export default function App() {
  const [session, setSession] = useState(loadSession);

  useEffect(() => {
    saveSession(session);
    if (!session) return;
    const timer = setTimeout(
      () => setSession(null),
      Math.max(0, session.expiresAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [session]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          index
          element={<HomePage />}
        />
        <Route
          path="/events"
          element={<EventsPage />}
        />
        <Login element={<Login />} />
        <Route
          path="/register"
          element={<Register />}
        />
        <Route>
          <Route
            path="/my-events"
            element={<MyEventsPage />}
          />
          <Route
            path="/events/new"
            element={<CreateEventPage />}
          />
        </Route>
        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}
