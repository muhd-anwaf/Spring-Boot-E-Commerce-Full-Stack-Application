import { NavLink, Outlet } from "react-router-dom";

const tabClass = ({ isActive }) =>
  `rounded-md px-4 py-2 text-sm font-medium ${isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-200"}`;

export default function AdminLayout() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Admin</h1>
      <nav aria-label="Admin sections" className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <NavLink to="/admin" end className={tabClass}>Products</NavLink>
        <NavLink to="/admin/categories" className={tabClass}>Categories</NavLink>
        <NavLink to="/admin/orders" className={tabClass}>Orders</NavLink>
        <NavLink to="/admin/users" className={tabClass}>Users</NavLink>
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
