import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/api";
import useAsync from "../hooks/useAsync";
import AddressForm from "../components/AddressForm";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import { fetchCart } from "../store/slices/cartSlice";
import { formatPrice, onImageError } from "../utils/format";

const PAYMENT_METHODS = [
  { value: "MOCK_CARD", label: "Test card (mock payment)", hint: "Approved instantly. No real card is used and nothing is charged." },
  { value: "COD", label: "Cash on delivery", hint: "Pay when your order arrives." },
];

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, totalPrice } = useSelector((state) => state.cart);
  const { data: addresses, loading, error, reload } = useAsync(async () => (await api.get("/users/addresses")).data, []);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [method, setMethod] = useState("MOCK_CARD");
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");

  if (products.length === 0 && !placing) {
    return (
      <EmptyState
        title="Your cart is empty"
        message="Add something to your cart before checking out."
        actionLabel="Browse products"
        actionTo="/"
      />
    );
  }
  if (loading) return <Spinner label="Loading your addresses..." />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  const addressId = selected ?? addresses?.[0]?.addressId ?? null;
  const showForm = adding || addresses.length === 0;

  const handleSaved = async (address) => {
    await reload();
    setSelected(address.addressId);
    setAdding(false);
    setMessage("");
    toast.success("Address saved");
  };

  const placeOrder = async () => {
    if (!addressId) {
      setMessage("Choose or add a delivery address first.");
      return;
    }
    setPlacing(true);
    setMessage("");
    try {
      const { data } = await api.post(`/order/users/payments/${method}`, { addressId });
      await dispatch(fetchCart());
      toast.success("Order placed!");
      navigate(`/orders/${data.orderId}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      setMessage(getErrorMessage(err, "We could not place your order."));
      dispatch(fetchCart()); // stock may have changed
      setPlacing(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section aria-labelledby="address-heading" className="rounded-xl bg-white p-6 shadow-sm">
            <h2 id="address-heading" className="text-lg font-semibold">1. Delivery address</h2>

            {!showForm && (
              <>
                <ul className="mt-4 space-y-2">
                  {addresses.map((address) => (
                    <li key={address.addressId}>
                      <label className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${address.addressId === addressId ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}>
                        <input
                          type="radio"
                          name="address"
                          checked={address.addressId === addressId}
                          onChange={() => setSelected(address.addressId)}
                          className="mt-1"
                        />
                        <span>
                          {address.buildingName}, {address.street}
                          <br />
                          {address.city}, {address.state} {address.pincode}, {address.country}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => setAdding(true)} className="mt-3 text-sm font-medium underline">
                  + Add a new address
                </button>
              </>
            )}

            {showForm && (
              <div className="mt-4">
                <AddressForm onSaved={handleSaved} onCancel={addresses.length > 0 ? () => setAdding(false) : undefined} />
              </div>
            )}
          </section>

          <section aria-labelledby="payment-heading" className="rounded-xl bg-white p-6 shadow-sm">
            <h2 id="payment-heading" className="text-lg font-semibold">2. Payment</h2>
            <div className="mt-4 space-y-2">
              {PAYMENT_METHODS.map((option) => (
                <label key={option.value} className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${method === option.value ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}>
                  <input type="radio" name="payment" checked={method === option.value} onChange={() => setMethod(option.value)} className="mt-1" />
                  <span>
                    <span className="font-medium">{option.label}</span>
                    <br />
                    <span className="text-slate-500">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {products.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 py-3 text-sm">
                <img src={item.image} alt="" onError={onImageError} className="h-12 w-12 rounded bg-slate-50 object-contain" />
                <span className="min-w-0 flex-1 truncate">{item.productName} <span className="text-slate-500">&times; {item.quantity}</span></span>
                <span className="font-medium">{formatPrice(item.specialPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          {message && <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}

          <button
            type="button"
            onClick={placeOrder}
            disabled={placing}
            className="mt-5 w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {placing ? "Placing order..." : `Place order · ${formatPrice(totalPrice)}`}
          </button>
          <Link to="/cart" className="mt-3 block text-center text-sm text-slate-500 hover:underline">Back to cart</Link>
        </aside>
      </div>
    </div>
  );
}
