import { describe, expect, it } from "vitest";
import { Route, Routes } from "react-router-dom";
import { screen } from "@testing-library/react";
import { AdminRoute, ProtectedRoute } from "./ProtectedRoute";
import { renderWithProviders, signedIn } from "../../test/utils";

const routes = (
  <Routes>
    <Route path="/login" element={<p>Login page</p>} />
    <Route element={<ProtectedRoute />}>
      <Route path="/orders" element={<p>Secret orders</p>} />
    </Route>
    <Route element={<AdminRoute />}>
      <Route path="/admin" element={<p>Admin panel</p>} />
    </Route>
  </Routes>
);

describe("route guards", () => {
  it("sends signed-out visitors to the login page", () => {
    renderWithProviders(routes, { route: "/orders" });
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Secret orders")).not.toBeInTheDocument();
  });

  it("lets signed-in users through", () => {
    renderWithProviders(routes, { route: "/orders", auth: signedIn() });
    expect(screen.getByText("Secret orders")).toBeInTheDocument();
  });

  it("shows a 403 message to non-admins on admin pages", () => {
    renderWithProviders(routes, { route: "/admin", auth: signedIn() });
    expect(screen.getByRole("heading", { name: /admins only/i })).toBeInTheDocument();
    expect(screen.queryByText("Admin panel")).not.toBeInTheDocument();
  });

  it("lets admins into admin pages", () => {
    renderWithProviders(routes, { route: "/admin", auth: signedIn(["ROLE_USER", "ROLE_ADMIN"]) });
    expect(screen.getByText("Admin panel")).toBeInTheDocument();
  });
});
