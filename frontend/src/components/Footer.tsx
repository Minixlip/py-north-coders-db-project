import { Link } from 'react-router-dom';

const currentYear = new Date().getFullYear();

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="site-width flex flex-col items-center gap-3 py-6 sm:flex-row sm:justify-between">
        <p className="text-sm text-slate-600">
          © {currentYear} Eventsy
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap justify-center gap-1">
            <li>
              <Link className="nav-link inline-flex min-h-11 items-center" to="/">
                Home
              </Link>
            </li>
            <li>
              <Link className="nav-link inline-flex min-h-11 items-center" to="/events">
                Events
              </Link>
            </li>
            <li>
              <Link className="nav-link inline-flex min-h-11 items-center" to="/my-events">
                My Events
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
