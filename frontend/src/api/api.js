import axios from "axios";

export const TOKEN_KEY = "ecom.token";
export const USER_KEY = "ecom.user";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACK_END_URL ?? "http://localhost:8080"}/api`,
  headers: { "Content-Type": "application/json" },
});

/** Read from localStorage without ever throwing (private mode, blocked storage). */
export const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key, value) => {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the session just will not survive a reload */
  }
};

let unauthorizedHandler = null;

/** The store registers a callback here so a 401 from any request logs the user out. */
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

api.interceptors.request.use((config) => {
  const token = readStorage(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginCall = error.config?.url?.includes("/auth/signin");
    if (status === 401 && !isLoginCall && readStorage(TOKEN_KEY) && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

/** Turns any axios error into a message that is safe to show to a user. */
export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (!error?.response) {
    return error?.request ? "Cannot reach the server. Check your connection and try again." : fallback;
  }
  const data = error.response.data;
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors)[0];
    if (first) return String(first);
  }
  if (typeof data?.message === "string" && data.message) return data.message;
  if (typeof data === "string" && data && data.length < 200) return data;
  if (error.response.status === 403) return "You do not have permission to do that.";
  if (error.response.status === 404) return "We could not find what you were looking for.";
  return fallback;
};

export default api;
