import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductCard from "./ProductCard";
import api from "../api/api";
import { renderWithProviders, signedIn } from "../test/utils";

vi.mock("react-hot-toast", () => ({ default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

const product = {
  productId: 4,
  productName: "Wireless Headphones",
  image: "http://localhost:8080/images/default.png",
  description: "Over-ear Bluetooth headphones",
  quantity: 5,
  price: 120,
  discount: 25,
  specialPrice: 90,
};

const withRoutes = (props) => (
  <Routes>
    <Route path="/" element={<ProductCard {...props} />} />
    <Route path="/login" element={<p>Login page</p>} />
  </Routes>
);

describe("ProductCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the discounted price, the original price and the discount badge", () => {
    renderWithProviders(withRoutes(product));
    expect(screen.getByText("$90.00")).toBeInTheDocument();
    expect(screen.getByText("$120.00")).toBeInTheDocument();
    expect(screen.getByText("-25%")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Wireless Headphones" })).toHaveAttribute("href", "/products/4");
  });

  it("disables the button when the product is out of stock", () => {
    renderWithProviders(withRoutes({ ...product, quantity: 0 }));
    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
  });

  it("sends signed-out visitors to the login page instead of calling the API", async () => {
    const post = vi.spyOn(api, "post");
    renderWithProviders(withRoutes(product));
    await userEvent.click(screen.getByRole("button", { name: "Add to Cart" }));
    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("adds to the server cart for signed-in users", async () => {
    vi.spyOn(api, "post").mockResolvedValue({
      data: { cartId: 1, totalPrice: 90, products: [{ ...product, quantity: 1 }] },
    });
    const { store } = renderWithProviders(withRoutes(product), { auth: signedIn() });

    await userEvent.click(screen.getByRole("button", { name: "Add to Cart" }));

    await vi.waitFor(() => expect(store.getState().cart.totalPrice).toBe(90));
    expect(api.post).toHaveBeenCalledWith("/carts/products/4/quantity/1");
  });
});
