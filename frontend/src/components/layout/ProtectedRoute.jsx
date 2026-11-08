import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAdmin, selectIsAuthenticated } from "../../store/slices/authSlice";

/** Sends visitors who are not signed in to /login and brings them back afterwards. */
export function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

/** Only for users with ROLE_ADMIN. Everyone else gets the 403 screen. */
export function AdminRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!isAdmin) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold">403 &mdash; Admins only</h1>
        <p className="mt-2 text-slate-500">Your account does not have access to this area.</p>
      </div>
    );
  }
  return <Outlet />;
}
