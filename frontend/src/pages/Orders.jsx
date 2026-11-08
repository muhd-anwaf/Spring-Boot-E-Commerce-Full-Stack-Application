import { Link, useSearchParams } from "react-router-dom";
import api from "../api/api";
import useAsync from "../hooks/useAsync";
import EmptyState from "../components/ui/EmptyState";
import ErrorMessage from "../components/ui/ErrorMessage";
import PagePagination from "../components/ui/PagePagination";
import Spinner from "../components/ui/Spinner";
import { formatDate, formatPrice, statusColor } from "../utils/format";

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const { data, loading, error, reload } = useAsync(
    async () => (await api.get(`/orders?pageNumber=${page - 1}&pageSize=10`)).data,
    [page],
  );

  if (loading) return <Spinner label="Loading your orders..." />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  if (!data || data.content.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        message="When you place an order it will show up here."
        actionLabel="Start shopping"
        actionTo="/"
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">My orders</h1>
      <ul className="mt-6 space-y-3">
        {data.content.map((order) => (
          <li key={order.orderId}>
            <Link
              to={`/orders/${order.orderId}`}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-white p-4 shadow-sm hover:shadow"
            >
              <div>
                <p className="font-semibold">Order #{order.orderId}</p>
                <p className="text-sm text-slate-500">{formatDate(order.orderDate)}</p>
              </div>
              <p className="text-sm text-slate-600">
                {order.orderItems.length} item{order.orderItems.length === 1 ? "" : "s"}
              </p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(order.orderStatus)}`}>
                {order.orderStatus}
              </span>
              <p className="ml-auto font-semibold">{formatPrice(order.totalAmount)}</p>
            </Link>
          </li>
        ))}
      </ul>
      <PagePagination
        page={page}
        totalPages={data.totalPages}
        onChange={(value) => setSearchParams(value === 1 ? {} : { page: String(value) })}
      />
    </div>
  );
}
