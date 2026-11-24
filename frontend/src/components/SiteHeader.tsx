import { useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function SiteHeader({ links, onSignOut }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  const closeMenu = () => setOpen(false);

  function handleSignOut() {
    closeMenu();
    onSignOut();
  }

  function handleEscape(event) {
    if (open && event.key === 'Escape') {
      closeMenu();
      toggle.current?.focus();
    }
  }

  return (
    <header
      className="border-b border-slate-200 bg-white"
      onKeyDown={handleEscape}
    >
      <div className="site-width header-inner">
        <Link
          className="brand"
          to="/"
          onClick={closeMenu}
        >
          <span
            className="brand-mark"
            aria-hidden="true"
          >
            +
          </span>
          Eventsy
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-navigation"
          onClick={() => setOpen((previous) => !previous)}
          ref={toggle}
        >
          {open ? 'Close' : 'Menu'}
        </button>
        <nav
          className="site-navigation"
          id="site-navigation"
          data-open={open}
          aria-label="Main"
        >
          <div className="nav-links">
            {links
              .filter(({ account }) => !account)
              .map(({ label, to }) => (
                <NavLink
                  key={to}
                  className="nav-link"
                  end
                  onClick={closeMenu}
                  to={to}
                >
                  {label}
                </NavLink>
              ))}
          </div>
          <div className="nav-account">
            {onSignOut ? (
              <button
                className="nav-link cursor-pointer"
                onClick={handleSignOut}
                type="button"
              >
                Log out
              </button>
            ) : (
              links
                .filter(({ account }) => account)
                .map(({ label, to }) => (
                  <NavLink
                    key={to}
                    className={
                      to === '/register' ? 'register-link' : 'nav-link'
                    }
                    onClick={closeMenu}
                    to={to}
                  >
                    {label}
                  </NavLink>
                ))
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
