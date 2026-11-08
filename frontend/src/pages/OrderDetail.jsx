import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/api";
import useAsync from "../hooks/useAsync";
import ErrorMessage from "../components/ui/ErrorMessage";
import Spinner from "../components/ui/Spinner";
import { formatDate, formatPrice, onImageError, statusColor } from "../utils/format";

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { data: order, loading, error, status, reload } = useAsync(
    async () => (await api.get(`/orders/${id}`)).data,
    [id],
  );
  const [cancelling, setCancelling] = useState(false);

  if (loading) return <Spinner label="Loading order..." />;
  if (status === 404) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Order not found</h1>
        <Link to="/orders" className="mt-4 inline-block text-sm font-medium underline">Back to my orders</Link>
      </div>
    );
  }
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  const cancel = async () => {
    if (!window.confirm("Cancel this order? The items go back into stock.")) return;
    setCancelling(true);
    try {
      await api.post(`/orders/${order.orderId}/cancel`);
      toast.success("Order cancelled");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const { address, payment } = order;

  return (
    <div>
      {location.state?.justPlaced && (
        <div role="status" className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <p className="font-semibold">Thank you! Your order has been placed.</p>
          <p className="text-sm">We have recorded order #{order.orderId}. You can follow its status on this page.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Order #{order.orderId}</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(order.orderStatus)}`}>
          {order.orderStatus}
        </span>
        <span className="text-sm text-slate-500">Placed on {formatDate(order.orderDate)}</span>
        {order.orderStatus === "PLACED" && (
          <button
            type="button"
            onClick={cancel}
            disabled={cancelling}
            className="ml-auto rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {cancelling ? "Cancelling..." : "Cancel order"}
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-slate-200 rounded-xl bg-white shadow-sm">
          {order.orderItems.map((item) => (
            <li key={item.orderItemId} className="flex items-center gap-4 p-4">
              <img src={item.product.image} alt="" onError={onImageError} className="h-16 w-16 rounded bg-slate-50 object-contain" />
              <div className="min-w-0 flex-1">
                <Link to={`/products/${item.product.productId}`} className="block truncate font-medium hover:underline">
                  {item.product.productName}
                </Link>
                <p className="text-sm text-slate-500">
                  {formatPrice(item.orderedProductPrice)} &times; {item.quantity}
                </p>
              </div>
              <p className="font-semibold">{formatPrice(item.orderedProductPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <aside className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Total</h2>
            <p className="mt-1 text-2xl font-bold">{formatPrice(order.totalAmount)}</p>
          </div>
          {address && (
            <div className="rounded-xl bg-white p-5 text-sm shadow-sm">
              <h2 className="font-semibold">Delivery address</h2>
              <p className="mt-2 text-slate-600">
                {address.buildingName}, {address.street}
                <br />
                {address.city}, {address.state} {address.pincode}
                <br />
                {address.country}
              </p>
            </div>
          )}
          {payment && (
            <div className="rounded-xl bg-white p-5 text-sm shadow-sm">
              <h2 className="font-semibold">Payment</h2>
              <p className="mt-2 text-slate-600">
                {payment.paymentMethod === "MOCK_CARD" ? "Test card (mock)" : "Cash on delivery"}
                <br />
                Status: {payment.pgStatus}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
