package com.ecommerce.project.payload;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.Set;

@Data
public class UpdateRolesRequest {
    /** Role names such as ROLE_USER, ROLE_SELLER, ROLE_ADMIN. */
    @NotEmpty(message = "Choose at least one role")
    private Set<String> roles;
}
