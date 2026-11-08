import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "../../api/api";
import { logout, sessionExpired } from "./authSlice";

const initialState = {
  cartId: null,
  products: [],
  totalPrice: 0,
  loading: false,
  /** productId currently being changed, so only that row shows a busy state */
  busyProductId: null,
};

const reject = (error, rejectWithValue) => rejectWithValue(getErrorMessage(error));

export const fetchCart = createAsyncThunk("cart/fetch", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/carts/users/cart");
    return data;
  } catch (error) {
    return reject(error, rejectWithValue);
  }
});

export const addToCart = createAsyncThunk("cart/add", async ({ productId, quantity = 1 }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/carts/products/${productId}/quantity/${quantity}`);
    return data;
  } catch (error) {
    return reject(error, rejectWithValue);
  }
});

/** operation: "add" (+1) or "delete" (-1) */
export const changeQuantity = createAsyncThunk("cart/changeQuantity", async ({ productId, operation }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/cart/products/${productId}/quantity/${operation}`);
    return data;
  } catch (error) {
    return reject(error, rejectWithValue);
  }
});

export const removeFromCart = createAsyncThunk("cart/remove", async (productId, { getState, dispatch, rejectWithValue }) => {
  try {
    const { cartId } = getState().cart;
    await api.delete(`/carts/${cartId}/product/${productId}`);
    return (await dispatch(fetchCart()).unwrap());
  } catch (error) {
    return reject(error, rejectWithValue);
  }
});

const applyCart = (state, cart) => {
  state.cartId = cart.cartId ?? null;
  state.products = cart.products ?? [];
  state.totalPrice = cart.totalPrice ?? 0;
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCartState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        applyCart(state, action.payload);
      })
      .addCase(fetchCart.rejected, (state) => {
        state.loading = false;
      })
      .addCase(addToCart.pending, (state, action) => {
        state.busyProductId = action.meta.arg.productId;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.busyProductId = null;
        applyCart(state, action.payload);
      })
      .addCase(addToCart.rejected, (state) => {
        state.busyProductId = null;
      })
      .addCase(changeQuantity.pending, (state, action) => {
        state.busyProductId = action.meta.arg.productId;
      })
      .addCase(changeQuantity.fulfilled, (state, action) => {
        state.busyProductId = null;
        applyCart(state, action.payload);
      })
      .addCase(changeQuantity.rejected, (state) => {
        state.busyProductId = null;
      })
      .addCase(removeFromCart.pending, (state, action) => {
        state.busyProductId = action.meta.arg;
      })
      .addCase(removeFromCart.fulfilled, (state) => {
        state.busyProductId = null;
      })
      .addCase(removeFromCart.rejected, (state) => {
        state.busyProductId = null;
      })
      // Leaving the account also leaves its cart
      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired, () => initialState);
  },
});

export const { clearCartState } = cartSlice.actions;

export const selectCartCount = (state) => state.cart.products.reduce((sum, item) => sum + (item.quantity || 0), 0);

export default cartSlice.reducer;
