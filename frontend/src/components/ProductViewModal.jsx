import { Link } from "react-router-dom";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import useCartActions from "../hooks/useCartActions";
import { formatPrice, onImageError } from "../utils/format";

// Quick-view dialog opened from a product card.
function ProductViewModal({ open, setOpen, product, isAvailable }) {
  const { productId, productName, image, description, quantity, price, discount, specialPrice } = product || {};
  const { add } = useCartActions();
  const hasDiscount = Number(discount) > 0 && specialPrice < price;

  const handleClose = () => setOpen(false);

  const handleAdd = async () => {
    const added = await add(product);
    if (added) handleClose();
  };

  return (
    <Dialog open={open} as="div" className="relative z-50 focus:outline-none" onClose={handleClose}>
      <DialogBackdrop className="fixed inset-0 bg-gray-500/40" />
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-md rounded-xl bg-gray-800 p-6 duration-300 ease-out data-closed:scale-95 data-closed:opacity-0"
          >
            {image && <img className="rounded-sm py-2" src={image} alt={productName} onError={onImageError} />}

            <DialogTitle as="h3" className="text-base font-medium text-white">
              {productName}
            </DialogTitle>

            <p className="mt-2 text-sm text-white/60">{description}</p>

            <div className="mt-3 flex items-baseline gap-2 text-white">
              {hasDiscount && <span className="text-xs line-through opacity-70">{formatPrice(price)}</span>}
              <span className="font-bold">{formatPrice(hasDiscount ? specialPrice : price)}</span>
              <span className="ml-auto text-xs text-white/60">
                {isAvailable ? `${quantity} in stock` : "Out of stock"}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                className="rounded-md bg-gray-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-600"
                onClick={handleClose}
              >
                Close
              </button>
              <Link
                to={`/products/${productId}`}
                onClick={handleClose}
                className="rounded-md px-3 py-1.5 text-sm font-semibold text-white underline hover:text-amber-300"
              >
                Details
              </Link>
              <button
                type="button"
                disabled={!isAvailable}
                onClick={handleAdd}
                className={`ml-auto rounded px-3 py-1.5 text-sm font-bold text-white ${
                  isAvailable ? "bg-blue-600 hover:bg-blue-800" : "cursor-not-allowed bg-slate-600 opacity-45"
                }`}
              >
                {isAvailable ? "Add to Cart" : "Out of stock"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

export default ProductViewModal;
