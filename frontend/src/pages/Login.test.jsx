import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "./Login";
import api from "../api/api";
import { renderWithProviders } from "../test/utils";

vi.mock("react-hot-toast", () => ({ default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

const page = (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<p>Home page</p>} />
  </Routes>
);

describe("Login page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows validation errors and does not call the API for empty input", async () => {
    const post = vi.spyOn(api, "post");
    renderWithProviders(page, { route: "/login" });

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("signs in, stores the session and goes to the home page", async () => {
    vi.spyOn(api, "post").mockResolvedValue({
      data: { id: 1, username: "anna", email: "anna@example.com", roles: ["ROLE_USER"], jwtToken: "jwt-123" },
    });
    vi.spyOn(api, "get").mockResolvedValue({ data: { cartId: null, products: [], totalPrice: 0 } });
    const { store } = renderWithProviders(page, { route: "/login" });

    await userEvent.type(screen.getByLabelText("Username"), "anna");
    await userEvent.type(screen.getByLabelText("Password"), "Passw0rd!");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Home page")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/auth/signin", { username: "anna", password: "Passw0rd!" });
    expect(store.getState().auth.token).toBe("jwt-123");
  });

  it("shows the server message when the credentials are wrong", async () => {
    vi.spyOn(api, "post").mockRejectedValue({ response: { status: 401, data: { message: "Invalid username or password" } } });
    renderWithProviders(page, { route: "/login" });

    await userEvent.type(screen.getByLabelText("Username"), "anna");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Invalid username or password"));
    expect(screen.queryByText("Home page")).not.toBeInTheDocument();
  });
});
