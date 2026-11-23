import { BrowserRouter, Link, Outlet, Route, Routes } from 'react-router-dom'
import SiteHeader from './components/SiteHeader.jsx'
import HomePage from './pages/HomePage.jsx'

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/events', label: 'Events' },
  { to: '/my-events', label: 'My Events' },
  { to: '/events/new', label: 'Create Event' },
  { to: '/login', label: 'Log in', account: true },
  { to: '/register', label: 'Register', account: true },
]

function SiteLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader links={navigation} />
      <main className="site-width py-8 sm:py-12" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  )
}

function RoutePlaceholder({ title }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-slate-600">Coming soon.</p>
    </section>
  )
}

function NotFoundPage() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <Link className="mt-4 inline-block font-semibold text-violet-800 underline" to="/">Back to home</Link>
    </section>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          {navigation.filter(({ to }) => to !== '/').map(({ to, label }) => (
            <Route key={to} path={to} element={<RoutePlaceholder title={label} />} />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
