import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  const { pathname, search, hash } = useLocation();

  if (isAuthenticated) return <Outlet />;

  const next = encodeURIComponent(pathname + search + hash);
  return <Navigate to={`/login?next=${next}`} replace />;
}
