import { BrowserRouter, Link, Outlet, Route, Routes } from 'react-router-dom';

import SiteHeader from './components/SiteHeader.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import CreateEventPage from './pages/CreateEventPage.js';
import EventsPage from './pages/EventsPage.js';
import HomePage from './pages/HomePage.js';
import MyEventsPage from './pages/MyEventsPage.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/events', label: 'Events' },
  { to: '/my-events', label: 'My Events' },
  { to: '/events/new', label: 'Create Event' },
  { to: '/login', label: 'Log in', account: true },
  { to: '/register', label: 'Register', account: true },
];

function SiteLayout() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
      >
        Skip to content
      </a>
      <SiteHeader
        links={navigation}
        onSignOut={isAuthenticated ? logout : undefined}
      />
      <main
        className="site-width py-8 sm:py-12"
        id="main-content"
        tabIndex={-1}
      >
        <Outlet />
      </main>
    </>
  );
}

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
          <Route element={<SiteLayout />}>
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
            <Route
              path="/my-events"
              element={<MyEventsPage />}
            />
            <Route
              path="/events/new"
              element={<CreateEventPage />}
            />
            <Route
              path="*"
              element={<NotFoundPage />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
