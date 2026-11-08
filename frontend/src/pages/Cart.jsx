import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import useCartActions from "../hooks/useCartActions";
import { formatPrice, onImageError } from "../utils/format";
import { selectIsAuthenticated } from "../store/slices/authSlice";

export default function Cart() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { products, totalPrice, loading, busyProductId } = useSelector((state) => state.cart);
  const { increase, decrease, remove } = useCartActions();

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Sign in to see your cart"
        message="Your cart is saved to your account, so it will be here next time too."
        actionLabel="Sign in"
        actionTo="/login"
      />
    );
  }
  if (loading && products.length === 0) return <Spinner label="Loading your cart..." />;
  if (products.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        message="Add something you like and it will show up here."
        actionLabel="Browse products"
        actionTo="/"
      />
    );
  }

  const itemCount = products.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Shopping cart</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-slate-200 rounded-xl bg-white shadow-sm">
          {products.map((item) => {
            const busy = busyProductId === item.productId;
            return (
              <li key={item.productId} className="flex flex-wrap items-center gap-4 p-4">
                <Link to={`/products/${item.productId}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-slate-50">
                  <img src={item.image} alt={item.productName} onError={onImageError} className="h-full w-full object-contain" />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link to={`/products/${item.productId}`} className="block truncate font-medium hover:underline">
                    {item.productName}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">{formatPrice(item.specialPrice)} each</p>
                </div>

                <div className="flex items-center rounded-md border border-slate-300" role="group" aria-label={`Quantity of ${item.productName}`}>
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${item.productName}`}
                    disabled={busy}
                    onClick={() => (item.quantity === 1 ? remove(item.productId) : decrease(item.productId))}
                    className="px-3 py-1.5 text-lg disabled:opacity-40"
                  >
                    &minus;
                  </button>
                  <span aria-live="polite" className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${item.productName}`}
                    disabled={busy}
                    onClick={() => increase(item.productId)}
                    className="px-3 py-1.5 text-lg disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <p className="w-24 text-right font-semibold">{formatPrice(item.specialPrice * item.quantity)}</p>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(item.productId)}
                  className="text-sm text-red-600 hover:underline disabled:opacity-40"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Items ({itemCount})</dt>
              <dd>{formatPrice(totalPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Shipping</dt>
              <dd>Free</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(totalPrice)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="mt-6 w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Proceed to checkout
          </button>
          <Link to="/" className="mt-3 block text-center text-sm text-slate-500 hover:underline">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
