import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { addToCart, changeQuantity, removeFromCart } from "../store/slices/cartSlice";
import { selectIsAuthenticated } from "../store/slices/authSlice";

/** Cart actions with the toasts and the "please sign in first" redirect built in. */
export default function useCartActions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const run = useCallback(async (action, successMessage) => {
    try {
      await dispatch(action).unwrap();
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (message) {
      toast.error(typeof message === "string" ? message : "Could not update your cart.");
      return false;
    }
  }, [dispatch]);

  const add = useCallback((product, quantity = 1) => {
    if (!isAuthenticated) {
      toast("Please sign in to add items to your cart");
      navigate("/login", { state: { from: location } });
      return Promise.resolve(false);
    }
    return run(addToCart({ productId: product.productId ?? product.id, quantity }), `${product.productName} added to cart`);
  }, [isAuthenticated, location, navigate, run]);

  const increase = useCallback((productId) => run(changeQuantity({ productId, operation: "add" })), [run]);
  const decrease = useCallback((productId) => run(changeQuantity({ productId, operation: "delete" })), [run]);
  const remove = useCallback((productId) => run(removeFromCart(productId), "Item removed"), [run]);

  return { add, increase, decrease, remove };
}
