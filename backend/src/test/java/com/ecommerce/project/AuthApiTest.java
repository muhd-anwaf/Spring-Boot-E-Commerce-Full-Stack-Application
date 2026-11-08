package com.ecommerce.project;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthApiTest extends ApiTestSupport {

    @Test
    void signup_createsCustomer_andDuplicateUsernameIsRejected() throws Exception {
        String name = uniqueName();
        Map<String, String> payload = Map.of("username", name, "email", name + "@example.com", "password", PASSWORD);

        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(body(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("User registered successfully!"));

        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(body(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(false))
                .andExpect(jsonPath("$.message").value("Username is already taken"));
    }

    @Test
    void signup_withInvalidInput_returnsFieldErrors() throws Exception {
        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("username", "ab", "email", "not-an-email", "password", "short"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.username").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void signup_ignoresRequestedAdminRole() throws Exception {
        String name = uniqueName();
        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("username", name, "email", name + "@example.com",
                                "password", PASSWORD, "role", new String[]{"admin"}))))
                .andExpect(status().isCreated());
        String token = login(name);

        mvc.perform(auth(get("/api/users/me"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles[0]").value("ROLE_USER"))
                .andExpect(jsonPath("$.roles", not(hasItem("ROLE_ADMIN"))));
    }

    @Test
    void signin_returnsTokenAndHttpOnlyCookie() throws Exception {
        String name = uniqueName();
        registerAndLogin(name);

        mvc.perform(post("/api/auth/signin").contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("username", name, "password", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(name))
                .andExpect(jsonPath("$.jwtToken").isNotEmpty())
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")));
    }

    @Test
    void signin_withWrongPassword_returns401() throws Exception {
        String name = uniqueName();
        registerAndLogin(name);

        mvc.perform(post("/api/auth/signin").contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("username", name, "password", "wrong-password"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(false));
    }

    @Test
    void protectedEndpoint_withoutToken_returns401() throws Exception {
        mvc.perform(get("/api/carts/users/cart"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(false));
    }

    @Test
    void adminEndpoints_requireAdminRole() throws Exception {
        String userToken = registerAndLogin(uniqueName());
        String adminToken = createAdminAndLogin();

        mvc.perform(auth(get("/api/admin/users"), userToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(false));

        mvc.perform(auth(get("/api/admin/users"), adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void tamperedToken_isRejected() throws Exception {
        String token = registerAndLogin(uniqueName());
        mvc.perform(auth(get("/api/users/me"), token + "x"))
                .andExpect(status().isUnauthorized());
    }
}
