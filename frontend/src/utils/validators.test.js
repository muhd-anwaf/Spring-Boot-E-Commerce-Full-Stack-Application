import { describe, expect, it } from "vitest";
import { hasErrors, validateAddress, validateLogin, validateProduct, validateProfile, validateRegister } from "./validators";

describe("validateLogin", () => {
  it("requires both fields", () => {
    const errors = validateLogin({ username: " ", password: "" });
    expect(errors.username).toBeDefined();
    expect(errors.password).toBeDefined();
  });

  it("accepts filled fields", () => {
    expect(hasErrors(validateLogin({ username: "anna", password: "x" }))).toBe(false);
  });
});

describe("validateRegister", () => {
  const valid = { username: "anna", email: "anna@example.com", password: "Passw0rd!", confirmPassword: "Passw0rd!" };

  it("accepts valid input", () => {
    expect(hasErrors(validateRegister(valid))).toBe(false);
  });

  it("rejects short names, bad emails, short passwords and mismatches", () => {
    const errors = validateRegister({ username: "ab", email: "nope", password: "short", confirmPassword: "different" });
    expect(Object.keys(errors).sort()).toEqual(["confirmPassword", "email", "password", "username"]);
  });
});

describe("validateAddress", () => {
  it("flags every empty field", () => {
    expect(Object.keys(validateAddress({}))).toHaveLength(6);
  });

  it("accepts a complete address", () => {
    const address = { street: "12 Main", buildingName: "B2", city: "Colombo", state: "WP", country: "LK", pincode: "10100" };
    expect(hasErrors(validateAddress(address))).toBe(false);
  });
});

describe("validateProfile", () => {
  it("only asks for passwords when one is being changed", () => {
    expect(hasErrors(validateProfile({ email: "a@b.co", currentPassword: "", newPassword: "", confirmPassword: "" }))).toBe(false);
    const errors = validateProfile({ email: "a@b.co", currentPassword: "", newPassword: "longenough1", confirmPassword: "other" });
    expect(errors.currentPassword).toBeDefined();
    expect(errors.confirmPassword).toBeDefined();
  });
});

describe("validateProduct", () => {
  it("rejects negative stock, zero price and out-of-range discounts", () => {
    const errors = validateProduct({ productName: "Mug", description: "A nice mug", price: "0", discount: "120", quantity: "-1" });
    expect(Object.keys(errors).sort()).toEqual(["discount", "price", "quantity"]);
  });
});
