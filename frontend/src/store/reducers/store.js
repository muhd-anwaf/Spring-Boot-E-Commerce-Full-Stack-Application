import { configureStore } from "@reduxjs/toolkit";
import { productReducer } from "./ProductReducer";
import { errorReducer } from "./errorReducer";
import authReducer, { sessionExpired } from "../slices/authSlice";
import cartReducer from "../slices/cartSlice";
import { setUnauthorizedHandler } from "../../api/api";

export const createStore = (preloadedState) =>
  configureStore({
    reducer: {
      products: productReducer,
      errors: errorReducer,
      auth: authReducer,
      cart: cartReducer,
    },
    preloadedState,
  });

export const store = createStore();

// Any 401 from the API means the token is gone or expired: drop the session.
setUnauthorizedHandler(() => store.dispatch(sessionExpired()));
