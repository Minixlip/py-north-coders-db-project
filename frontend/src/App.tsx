import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

import CreateEventPage from './pages/CreateEventPage.js';
import EventsPage from './pages/EventsPage.js';
import HomePage from './pages/HomePage.js';
import MyEventsPage from './pages/MyEventsPage.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import { AuthProvider } from './context/AuthContext.js';

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
  return (
    <AuthProvider>
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
          <Route
            path="/login"
            element={<Login />}
          />
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
    </AuthProvider>
  );
}
