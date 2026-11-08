package com.ecommerce.project;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CartOrderFlowTest extends ApiTestSupport {

    private static final Map<String, String> ADDRESS = Map.of(
            "street", "12 Main Street", "buildingName", "Block B", "city", "Colombo",
            "state", "Western", "country", "Sri Lanka", "pincode", "10100");

    private long createAddress(String token) throws Exception {
        String response = mvc.perform(jsonBody(auth(post("/api/addresses"), token), ADDRESS))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return parse(response).get("addressId").asLong();
    }

    private long stockOf(long productId) throws Exception {
        String response = mvc.perform(get("/api/public/products/" + productId)).andReturn().getResponse().getContentAsString();
        return parse(response).get("quantity").asLong();
    }

    @Test
    void cart_addIncreaseDecreaseRemove_keepsTotalsCorrect() throws Exception {
        String admin = createAdminAndLogin();
        long category = createCategory(admin, "Cart " + uniqueName());
        long product = createProduct(admin, category, "Mug " + uniqueName(), 10, 10, 5); // special price 9.00
        String user = registerAndLogin(uniqueName());

        mvc.perform(auth(get("/api/carts/users/cart"), user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPrice").value(0.0))
                .andExpect(jsonPath("$.products.length()").value(0));

        mvc.perform(auth(post("/api/carts/products/" + product + "/quantity/2"), user))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalPrice").value(18.0));

        // Adding the same product again increases the quantity
        mvc.perform(auth(post("/api/carts/products/" + product + "/quantity/1"), user))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.products[0].quantity").value(3))
                .andExpect(jsonPath("$.totalPrice").value(27.0));

        mvc.perform(auth(put("/api/cart/products/" + product + "/quantity/delete"), user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPrice").value(18.0));

        // Cannot go above stock
        mvc.perform(auth(post("/api/carts/products/" + product + "/quantity/10"), user))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(false));

        JsonNode cart = parse(mvc.perform(auth(get("/api/carts/users/cart"), user))
                .andReturn().getResponse().getContentAsString());
        long cartId = cart.get("cartId").asLong();

        mvc.perform(auth(delete("/api/carts/" + cartId + "/product/" + product), user)).andExpect(status().isOk());
        mvc.perform(auth(get("/api/carts/users/cart"), user))
                .andExpect(jsonPath("$.totalPrice").value(0.0))
                .andExpect(jsonPath("$.products.length()").value(0));
    }

    @Test
    void checkout_createsOrder_reducesStock_clearsCart_andCanBeCancelled() throws Exception {
        String admin = createAdminAndLogin();
        long category = createCategory(admin, "Order " + uniqueName());
        long product = createProduct(admin, category, "Lamp " + uniqueName(), 40, 0, 10);
        String user = registerAndLogin(uniqueName());
        long addressId = createAddress(user);

        mvc.perform(auth(post("/api/carts/products/" + product + "/quantity/3"), user)).andExpect(status().isCreated());

        String created = mvc.perform(jsonBody(auth(post("/api/order/users/payments/MOCK_CARD"), user), Map.of("addressId", addressId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderStatus").value("PLACED"))
                .andExpect(jsonPath("$.totalAmount").value(120.0))
                .andExpect(jsonPath("$.payment.pgStatus").value("SUCCEEDED"))
                .andExpect(jsonPath("$.orderItems.length()").value(1))
                .andExpect(jsonPath("$.address.city").value("Colombo"))
                .andReturn().getResponse().getContentAsString();
        long orderId = parse(created).get("orderId").asLong();

        org.junit.jupiter.api.Assertions.assertEquals(7, stockOf(product));
        mvc.perform(auth(get("/api/carts/users/cart"), user)).andExpect(jsonPath("$.products.length()").value(0));

        mvc.perform(auth(get("/api/orders"), user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].orderId").value(orderId));
        mvc.perform(auth(get("/api/orders/" + orderId), user)).andExpect(status().isOk());

        // Another customer cannot see it
        String other = registerAndLogin(uniqueName());
        mvc.perform(auth(get("/api/orders/" + orderId), other)).andExpect(status().isNotFound());

        mvc.perform(auth(post("/api/orders/" + orderId + "/cancel"), user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderStatus").value("CANCELLED"));
        org.junit.jupiter.api.Assertions.assertEquals(10, stockOf(product));
    }

    @Test
    void checkout_withEmptyCart_isRejected() throws Exception {
        String user = registerAndLogin(uniqueName());
        long addressId = createAddress(user);

        mvc.perform(jsonBody(auth(post("/api/order/users/payments/COD"), user), Map.of("addressId", addressId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Your cart is empty"));
    }

    @Test
    void checkout_withSomeoneElsesAddress_returns404() throws Exception {
        String admin = createAdminAndLogin();
        long category = createCategory(admin, "Addr " + uniqueName());
        long product = createProduct(admin, category, "Pen " + uniqueName(), 5, 0, 10);
        String owner = registerAndLogin(uniqueName());
        String thief = registerAndLogin(uniqueName());
        long ownerAddress = createAddress(owner);

        mvc.perform(auth(post("/api/carts/products/" + product + "/quantity/1"), thief)).andExpect(status().isCreated());
        mvc.perform(jsonBody(auth(post("/api/order/users/payments/COD"), thief), Map.of("addressId", ownerAddress)))
                .andExpect(status().isNotFound());

        // And the address list/detail never leaks other users' addresses
        mvc.perform(auth(get("/api/addresses/" + ownerAddress), thief)).andExpect(status().isNotFound());
        mvc.perform(auth(get("/api/addresses"), thief)).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void checkout_failsWhenStockDroppedBelowCartQuantity() throws Exception {
        String admin = createAdminAndLogin();
        long category = createCategory(admin, "Race " + uniqueName());
        String name = "Rare " + uniqueName();
        long product = createProduct(admin, category, name, 30, 0, 5);
        String user = registerAndLogin(uniqueName());
        long addressId = createAddress(user);
        mvc.perform(auth(post("/api/carts/products/" + product + "/quantity/4"), user)).andExpect(status().isCreated());

        // Admin lowers the stock after the item was added to the cart
        mvc.perform(jsonBody(auth(put("/api/admin/products/" + product), admin),
                Map.of("productName", name, "description", "Only a few left", "price", 30, "discount", 0, "quantity", 2)))
                .andExpect(status().isOk());

        mvc.perform(jsonBody(auth(post("/api/order/users/payments/MOCK_CARD"), user), Map.of("addressId", addressId)))
                .andExpect(status().isBadRequest());
        org.junit.jupiter.api.Assertions.assertEquals(2, stockOf(product));
    }

    @Test
    void adminCanListOrdersAndAdvanceStatus() throws Exception {
        String admin = createAdminAndLogin();
        long category = createCategory(admin, "Adm " + uniqueName());
        long product = createProduct(admin, category, "Box " + uniqueName(), 15, 0, 10);
        String user = registerAndLogin(uniqueName());
        long addressId = createAddress(user);
        mvc.perform(auth(post("/api/carts/products/" + product + "/quantity/1"), user)).andExpect(status().isCreated());
        long orderId = parse(mvc.perform(jsonBody(auth(post("/api/order/users/payments/COD"), user), Map.of("addressId", addressId)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("orderId").asLong();

        mvc.perform(auth(get("/api/admin/orders"), admin)).andExpect(status().isOk()).andExpect(jsonPath("$.content").isArray());

        mvc.perform(jsonBody(auth(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/admin/orders/" + orderId + "/status"), admin),
                        Map.of("status", "SHIPPED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderStatus").value("SHIPPED"));

        // A shipped order can no longer be cancelled by the customer
        mvc.perform(auth(post("/api/orders/" + orderId + "/cancel"), user)).andExpect(status().isBadRequest());
    }

    @Test
    void profileUpdate_changesEmail_andPasswordNeedsCurrentPassword() throws Exception {
        String name = uniqueName();
        String token = registerAndLogin(name);

        mvc.perform(jsonBody(auth(put("/api/users/me"), token), Map.of("email", name + "+new@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(name + "+new@example.com"));

        mvc.perform(jsonBody(auth(put("/api/users/me"), token),
                        Map.of("email", name + "+new@example.com", "currentPassword", "wrong", "newPassword", "BrandNew123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is incorrect"));
    }
}
