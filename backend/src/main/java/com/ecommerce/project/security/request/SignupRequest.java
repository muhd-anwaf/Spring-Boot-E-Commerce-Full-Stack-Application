package com.ecommerce.project.security.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Self-service signup. Roles cannot be chosen by the caller; new accounts always get ROLE_USER. */
@Data
public class SignupRequest {
    @NotBlank
    @Size(min = 3, max = 20, message = "Username must be 3 to 20 characters")
    private String username;

    @NotBlank
    @Size(max = 50)
    @Email(message = "Enter a valid email address")
    private String email;

    @NotBlank
    @Size(min = 8, max = 40, message = "Password must be 8 to 40 characters")
    private String password;
}
