import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import ProductViewModal from "./ProductViewModal";
import useCartActions from "../hooks/useCartActions";
import { formatPrice, onImageError } from "../utils/format";

const ProductCard = ({
    productId,
    productName,
    image,
    description,
    quantity,
    price,
    discount,
    specialPrice,
}) => {
    const [openProductViewModal, setOpenProductViewModal] = useState(false);
    const { add } = useCartActions();
    const busy = useSelector((state) => state.cart.busyProductId) === productId;
    const isAvailable = Number(quantity) > 0;
    const hasDiscount = Number(discount) > 0 && specialPrice < price;

    const product = { id: productId, productId, productName, image, description, quantity, price, discount, specialPrice };

    return (
        <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors duration-200 hover:border-slate-300">
            <button
                type="button"
                onClick={() => setOpenProductViewModal(true)}
                aria-label={`Quick view ${productName}`}
                className="relative aspect-square cursor-pointer overflow-hidden bg-slate-50"
            >
                <img
                    className="h-full w-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                    src={image}
                    alt={productName}
                    loading="lazy"
                    onError={onImageError}
                />
                {hasDiscount && (
                    <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                        -{Math.round(discount)}%
                    </span>
                )}
            </button>

            <div className="px-4 pt-4">
                <Link to={`/products/${productId}`} className="block truncate text-base font-medium text-slate-900 hover:underline">
                    {productName}
                </Link>
                <div className="mt-1.5 text-sm leading-5 text-slate-500">
                    <p className="line-clamp-2">{description}</p>
                </div>
            </div>

            <div className="mt-auto flex items-center gap-3 px-4 pb-4 pt-4">
                <div className="flex items-baseline gap-2">
                    {hasDiscount && (
                        <span className="text-xs text-slate-400 line-through">{formatPrice(price)}</span>
                    )}
                    <span className="text-base font-semibold text-slate-900">
                        {formatPrice(hasDiscount ? specialPrice : price)}
                    </span>
                </div>

                <button
                    type="button"
                    disabled={!isAvailable || busy}
                    onClick={() => add(product)}
                    className={`ml-auto rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        isAvailable
                            ? "border-slate-900 bg-slate-900 text-white hover:bg-white hover:text-slate-900 disabled:opacity-60"
                            : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    }`}
                >
                    {!isAvailable ? "Out of stock" : busy ? "Adding..." : "Add to Cart"}
                </button>
            </div>

            <ProductViewModal
                open={openProductViewModal}
                setOpen={setOpenProductViewModal}
                product={product}
                isAvailable={isAvailable}
            />
        </div>
    );
};

export default ProductCard;
