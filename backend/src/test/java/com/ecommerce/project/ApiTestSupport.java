package com.ecommerce.project;

import com.ecommerce.project.model.AppRole;
import com.ecommerce.project.model.Role;
import com.ecommerce.project.model.User;
import com.ecommerce.project.repositories.RoleRepository;
import com.ecommerce.project.repositories.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Shared helpers for the API tests: they use the real security filter chain and an in-memory H2 database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
abstract class ApiTestSupport {

    static final String PASSWORD = "Passw0rd!";

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected RoleRepository roleRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected TransactionTemplate transactions;

    protected String uniqueName() {
        return "u" + UUID.randomUUID().toString().substring(0, 8);
    }

    protected String body(Object value) throws Exception {
        return json.writeValueAsString(value);
    }

    protected JsonNode parse(String content) throws Exception {
        return json.readTree(content);
    }

    protected MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder builder, String token) {
        return builder.header("Authorization", "Bearer " + token);
    }

    protected MockHttpServletRequestBuilder jsonBody(MockHttpServletRequestBuilder builder, Object payload) throws Exception {
        return builder.contentType(MediaType.APPLICATION_JSON).content(body(payload));
    }

    /** Registers a normal customer through the public API and returns a JWT. */
    protected String registerAndLogin(String username) throws Exception {
        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("username", username, "email", username + "@example.com", "password", PASSWORD))))
                .andExpect(status().isCreated());
        return login(username);
    }

    protected String login(String username) throws Exception {
        String response = mvc.perform(post("/api/auth/signin").contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("username", username, "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return parse(response).get("jwtToken").asText();
    }

    /** Creates an admin directly in the database (there is intentionally no public way to become admin). */
    protected String createAdminAndLogin() throws Exception {
        String username = uniqueName();
        // One transaction so the roles are managed entities (User cascades PERSIST to roles)
        transactions.executeWithoutResult(status -> {
            User admin = new User(username, username + "@example.com", passwordEncoder.encode(PASSWORD));
            Set<Role> roles = new HashSet<>();
            roles.add(roleRepository.findByRoleName(AppRole.ROLE_USER).orElseThrow());
            roles.add(roleRepository.findByRoleName(AppRole.ROLE_ADMIN).orElseThrow());
            admin.setRoles(roles);
            userRepository.save(admin);
        });
        return login(username);
    }

    protected long createCategory(String adminToken, String name) throws Exception {
        String response = mvc.perform(jsonBody(auth(post("/api/admin/categories"), adminToken), Map.of("categoryName", name)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return parse(response).get("categoryId").asLong();
    }

    protected long createProduct(String adminToken, long categoryId, String name, double price, double discount, int quantity)
            throws Exception {
        Map<String, Object> payload = Map.of(
                "productName", name,
                "description", "Description for " + name,
                "price", price,
                "discount", discount,
                "quantity", quantity);
        String response = mvc.perform(jsonBody(auth(post("/api/admin/categories/" + categoryId + "/product"), adminToken), payload))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return parse(response).get("productId").asLong();
    }
}
