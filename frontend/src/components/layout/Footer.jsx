import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-12 bg-slate-900 text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>&copy; {new Date().getFullYear()} E-Shop. A demo store: payments run in test mode and nothing is charged.</p>
        <div className="flex gap-4">
          <Link to="/" className="hover:text-white">Products</Link>
          <Link to="/cart" className="hover:text-white">Cart</Link>
          <Link to="/orders" className="hover:text-white">Orders</Link>
        </div>
      </div>
    </footer>
  );
}
