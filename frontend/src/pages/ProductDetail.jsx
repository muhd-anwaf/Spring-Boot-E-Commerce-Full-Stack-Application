import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../api/api";
import useAsync from "../hooks/useAsync";
import useCartActions from "../hooks/useCartActions";
import Spinner from "../components/ui/Spinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import { formatPrice, onImageError } from "../utils/format";

export default function ProductDetail() {
  const { id } = useParams();
  const { data: product, loading, error, status, reload } = useAsync(
    async () => (await api.get(`/public/products/${id}`)).data,
    [id],
  );
  const { add } = useCartActions();
  const [quantity, setQuantity] = useState(1);
  const busy = useSelector((state) => state.cart.busyProductId) === product?.productId;

  if (loading) return <Spinner label="Loading product..." />;
  if (status === 404) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <p className="mt-2 text-slate-500">It may have been removed.</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium underline">Back to products</Link>
      </div>
    );
  }
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  const inStock = Number(product.quantity) > 0;
  const hasDiscount = Number(product.discount) > 0 && product.specialPrice < product.price;
  const maxQuantity = Math.max(1, Number(product.quantity));

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
        <Link to="/" className="hover:underline">Products</Link>
        {product.categoryName && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/?category=${encodeURIComponent(product.categoryName)}`} className="hover:underline">
              {product.categoryName}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 rounded-xl bg-white p-6 shadow-sm md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-slate-50">
          <img src={product.image} alt={product.productName} onError={onImageError} className="h-full w-full object-contain" />
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold text-slate-900">{product.productName}</h1>
          <p className="mt-3 text-slate-600">{product.description}</p>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(hasDiscount ? product.specialPrice : product.price)}</span>
            {hasDiscount && (
              <>
                <span className="text-slate-400 line-through">{formatPrice(product.price)}</span>
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  Save {Math.round(product.discount)}%
                </span>
              </>
            )}
          </div>

          <p className={`mt-3 text-sm font-medium ${inStock ? "text-green-700" : "text-red-600"}`}>
            {inStock ? (product.quantity <= 5 ? `Only ${product.quantity} left in stock` : "In stock") : "Out of stock"}
          </p>

          {inStock && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-md border border-slate-300">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  className="px-3 py-2 text-lg disabled:opacity-40"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => q - 1)}
                >
                  &minus;
                </button>
                <span aria-live="polite" className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  className="px-3 py-2 text-lg disabled:opacity-40"
                  disabled={quantity >= maxQuantity}
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => add(product, quantity)}
                className="rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {busy ? "Adding..." : "Add to cart"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
