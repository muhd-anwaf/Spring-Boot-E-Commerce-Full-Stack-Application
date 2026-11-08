import { afterEach, describe, expect, it, vi } from "vitest";
import api, { TOKEN_KEY, getErrorMessage, setUnauthorizedHandler } from "./api";

const respondWith = (status, data = {}) => (config) =>
  status < 400
    ? Promise.resolve({ data, status, statusText: "OK", headers: {}, config })
    : Promise.reject(Object.assign(new Error("failed"), { config, response: { status, data, headers: {}, config } }));

afterEach(() => setUnauthorizedHandler(null));

describe("api client", () => {
  it("sends the stored token as a Bearer header", async () => {
    localStorage.setItem(TOKEN_KEY, "my-token");
    let seen;
    api.defaults.adapter = (config) => {
      seen = config.headers.Authorization;
      return respondWith(200)(config);
    };
    await api.get("/anything");
    expect(seen).toBe("Bearer my-token");
  });

  it("sends no Authorization header when signed out", async () => {
    let seen = "unset";
    api.defaults.adapter = (config) => {
      seen = config.headers.Authorization;
      return respondWith(200)(config);
    };
    await api.get("/anything");
    expect(seen).toBeUndefined();
  });

  it("signs the user out when the API answers 401", async () => {
    localStorage.setItem(TOKEN_KEY, "expired");
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    api.defaults.adapter = respondWith(401, { message: "Authentication is required" });
    await expect(api.get("/carts/users/cart")).rejects.toBeDefined();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not treat a wrong password on sign-in as an expired session", async () => {
    localStorage.setItem(TOKEN_KEY, "still-valid");
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    api.defaults.adapter = respondWith(401, { message: "Invalid username or password" });
    await expect(api.post("/auth/signin", {})).rejects.toBeDefined();
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("getErrorMessage", () => {
  it("prefers the first field error, then the message", () => {
    expect(getErrorMessage({ response: { status: 400, data: { message: "Validation failed", errors: { email: "Enter a valid email" } } } })).toBe("Enter a valid email");
    expect(getErrorMessage({ response: { status: 400, data: { message: "Cart is empty" } } })).toBe("Cart is empty");
  });

  it("explains network failures and permission errors", () => {
    expect(getErrorMessage({ request: {} })).toMatch(/cannot reach the server/i);
    expect(getErrorMessage({ response: { status: 403, data: {} } })).toMatch(/permission/i);
  });
});
