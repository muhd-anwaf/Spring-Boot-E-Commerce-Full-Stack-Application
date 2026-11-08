package com.ecommerce.project;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductApiTest extends ApiTestSupport {

    @Test
    void publicCatalog_isReadableWithoutLogin_andFiltersByKeywordAndCategory() throws Exception {
        String admin = createAdminAndLogin();
        String tag = uniqueName();
        long category = createCategory(admin, "Cat " + tag);
        createProduct(admin, category, "Alpha " + tag, 100, 10, 5);
        createProduct(admin, category, "Beta " + tag, 50, 0, 5);

        mvc.perform(get("/api/public/products").param("category", "Cat " + tag).param("sortBy", "specialPrice").param("sortOrder", "asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].productName").value("Beta " + tag))
                .andExpect(jsonPath("$.content[1].specialPrice").value(90.0));

        mvc.perform(get("/api/public/products").param("keyword", "alpha " + tag).param("sortBy", "specialPrice").param("sortOrder", "desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].categoryName").value("Cat " + tag));
    }

    @Test
    void unknownSortField_returns400_insteadOfServerError() throws Exception {
        mvc.perform(get("/api/public/products").param("sortBy", "password"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(false));
    }

    @Test
    void productDetail_returnsProduct_or404() throws Exception {
        String admin = createAdminAndLogin();
        long category = createCategory(admin, "Detail " + uniqueName());
        long id = createProduct(admin, category, "Gadget " + uniqueName(), 20, 0, 3);

        mvc.perform(get("/api/public/products/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId").value(id))
                .andExpect(jsonPath("$.image").value(org.hamcrest.Matchers.endsWith("default.png")));

        mvc.perform(get("/api/public/products/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(false));
    }

    @Test
    void customer_cannotCreateProductsOrCategories() throws Exception {
        String admin = createAdminAndLogin();
        long category = createCategory(admin, "Locked " + uniqueName());
        String customer = registerAndLogin(uniqueName());

        mvc.perform(jsonBody(auth(post("/api/admin/categories/" + category + "/product"), customer),
                        Map.of("productName", "Hacked item", "description", "should not work", "price", 1, "quantity", 1)))
                .andExpect(status().isForbidden());

        mvc.perform(jsonBody(auth(post("/api/admin/categories"), customer), Map.of("categoryName", "Nope")))
                .andExpect(status().isForbidden());
    }

    @Test
    void createProduct_withInvalidBody_returnsFieldErrors() throws Exception {
        String admin = createAdminAndLogin();
        long category = createCategory(admin, "Valid " + uniqueName());

        mvc.perform(jsonBody(auth(post("/api/admin/categories/" + category + "/product"), admin),
                        Map.of("productName", "x", "description", "short", "price", -5, "quantity", -1, "discount", 150)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.productName").exists())
                .andExpect(jsonPath("$.errors.price").exists())
                .andExpect(jsonPath("$.errors.quantity").exists())
                .andExpect(jsonPath("$.errors.discount").exists());
    }

    @Test
    void updateProduct_recalculatesSpecialPrice() throws Exception {
        String admin = createAdminAndLogin();
        long category = createCategory(admin, "Upd " + uniqueName());
        String name = "Item " + uniqueName();
        long id = createProduct(admin, category, name, 200, 0, 4);

        mvc.perform(jsonBody(auth(put("/api/admin/products/" + id), admin),
                        Map.of("productName", name, "description", "Updated description", "price", 200, "discount", 25, "quantity", 4)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.specialPrice").value(150.0));
    }
}
