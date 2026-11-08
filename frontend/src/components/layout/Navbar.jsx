import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiMenu, FiShoppingCart, FiX } from "react-icons/fi";
import { logout, selectIsAdmin, selectIsAuthenticated } from "../../store/slices/authSlice";
import { selectCartCount } from "../../store/slices/cartSlice";

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const user = useSelector((state) => state.auth.user);
  const cartCount = useSelector(selectCartCount);

  const close = () => setOpen(false);

  const handleLogout = async () => {
    close();
    await dispatch(logout());
    toast.success("You have been signed out");
    navigate("/");
  };

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={close}>Products</NavLink>
      {isAuthenticated && <NavLink to="/orders" className={linkClass} onClick={close}>My orders</NavLink>}
      {isAdmin && <NavLink to="/admin" className={linkClass} onClick={close}>Admin</NavLink>}
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-slate-900 shadow">
      <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-8">
        <Link to="/" className="text-lg font-bold tracking-tight text-white">
          <span className="text-amber-400">E</span>-Shop
        </Link>

        <div className="ml-4 hidden items-center gap-1 md:flex">{links}</div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/cart"
            aria-label={`Cart, ${cartCount} items`}
            className="relative rounded-md p-2 text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            <FiShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-slate-900">
                {cartCount}
              </span>
            )}
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="text-sm text-slate-200 hover:text-white">
                  {user?.username ?? "Profile"}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-md px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800">Sign in</Link>
                <Link to="/register" className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-amber-400">
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-slate-200 hover:bg-slate-800 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-slate-700 px-4 pb-4 pt-2 md:hidden">
          {links}
          {isAuthenticated ? (
            <>
              <NavLink to="/profile" className={linkClass} onClick={close}>Profile</NavLink>
              <button type="button" onClick={handleLogout} className="rounded-md px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800">
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={close}>Sign in</NavLink>
              <NavLink to="/register" className={linkClass} onClick={close}>Register</NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
