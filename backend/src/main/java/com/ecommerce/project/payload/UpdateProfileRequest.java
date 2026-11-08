package com.ecommerce.project.payload;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @NotBlank(message = "Email is required")
    @Size(max = 50)
    @Email(message = "Enter a valid email address")
    private String email;

    /** Only needed when changing the password. */
    private String currentPassword;

    @Size(min = 8, max = 40, message = "New password must be 8 to 40 characters")
    private String newPassword;
}
