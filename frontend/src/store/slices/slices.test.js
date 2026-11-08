import { describe, expect, it } from "vitest";
import authReducer, { login, selectIsAdmin, selectIsAuthenticated, sessionExpired } from "./authSlice";
import cartReducer, { addToCart, fetchCart, selectCartCount } from "./cartSlice";
import { logout } from "./authSlice";
import { TOKEN_KEY } from "../../api/api";

const emptyAuth = { token: null, user: null, loading: false };
const emptyCart = { cartId: null, products: [], totalPrice: 0, loading: false, busyProductId: null };

describe("authSlice", () => {
  it("stores the token and user on login and persists the token", () => {
    const state = authReducer(
      emptyAuth,
      login.fulfilled({ token: "abc", user: { id: 1, username: "anna", roles: ["ROLE_USER"] } }, "req", {}),
    );
    expect(state.token).toBe("abc");
    expect(state.user.username).toBe("anna");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("abc");
  });

  it("clears everything when the session expires", () => {
    const signedIn = { token: "abc", user: { roles: [] }, loading: false };
    const state = authReducer(signedIn, sessionExpired());
    expect(state).toMatchObject({ token: null, user: null });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("recognises admins", () => {
    const state = { auth: { token: "t", user: { roles: ["ROLE_USER", "ROLE_ADMIN"] } } };
    expect(selectIsAuthenticated(state)).toBe(true);
    expect(selectIsAdmin(state)).toBe(true);
    expect(selectIsAdmin({ auth: { token: "t", user: { roles: ["ROLE_USER"] } } })).toBe(false);
  });
});

describe("cartSlice", () => {
  const cart = {
    cartId: 7,
    totalPrice: 27,
    products: [
      { productId: 1, quantity: 2, specialPrice: 9 },
      { productId: 2, quantity: 1, specialPrice: 9 },
    ],
  };

  it("applies the cart returned by the server", () => {
    const state = cartReducer(emptyCart, fetchCart.fulfilled(cart, "req"));
    expect(state.cartId).toBe(7);
    expect(state.totalPrice).toBe(27);
    expect(selectCartCount({ cart: state })).toBe(3);
  });

  it("marks only the product being added as busy", () => {
    const pending = cartReducer(emptyCart, addToCart.pending("req", { productId: 5 }));
    expect(pending.busyProductId).toBe(5);
    const done = cartReducer(pending, addToCart.fulfilled(cart, "req", { productId: 5 }));
    expect(done.busyProductId).toBeNull();
  });

  it("is emptied on logout and on session expiry", () => {
    const filled = cartReducer(emptyCart, fetchCart.fulfilled(cart, "req"));
    expect(cartReducer(filled, logout.fulfilled(undefined, "req"))).toEqual(emptyCart);
    expect(cartReducer(filled, sessionExpired())).toEqual(emptyCart);
  });
});
