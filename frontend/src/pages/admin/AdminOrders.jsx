import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/api";
import useAsync from "../../hooks/useAsync";
import PagePagination from "../../components/ui/PagePagination";
import Spinner from "../../components/ui/Spinner";
import ErrorMessage from "../../components/ui/ErrorMessage";
import { ORDER_STATUSES, formatDate, formatPrice, statusColor } from "../../utils/format";

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(
    async () => (await api.get(`/admin/orders?pageNumber=${page - 1}&pageSize=10`)).data,
    [page],
  );

  const changeStatus = async (order, status) => {
    try {
      await api.patch(`/admin/orders/${order.orderId}/status`, { status });
      toast.success(`Order #${order.orderId} is now ${status}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    reload();
  };

  if (loading && !data) return <Spinner label="Loading orders..." />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  return (
    <div>
      <h2 className="text-lg font-semibold">Orders ({data.totalElements})</h2>
      {data.content.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No orders have been placed yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Date</th><th className="p-3">Total</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.content.map((order) => {
                const locked = order.orderStatus === "CANCELLED" || order.orderStatus === "DELIVERED";
                return (
                  <tr key={order.orderId}>
                    <td className="p-3"><Link to={`/orders/${order.orderId}`} className="font-medium underline">#{order.orderId}</Link></td>
                    <td className="p-3 text-slate-600">{order.email}</td>
                    <td className="p-3">{formatDate(order.orderDate)}</td>
                    <td className="p-3">{formatPrice(order.totalAmount)}</td>
                    <td className="p-3">
                      {locked ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(order.orderStatus)}`}>{order.orderStatus}</span>
                      ) : (
                        <select
                          aria-label={`Status of order ${order.orderId}`}
                          value={order.orderStatus}
                          onChange={(event) => changeStatus(order, event.target.value)}
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                        >
                          {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <PagePagination page={page} totalPages={data.totalPages} onChange={setPage} />
    </div>
  );
}
