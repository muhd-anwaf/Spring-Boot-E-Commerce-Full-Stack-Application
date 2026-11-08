package com.ecommerce.project.payload;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddressDTO {
    private Long addressId;

    @NotBlank(message = "Street is required")
    @Size(min = 3, max = 120, message = "Street must be 3 to 120 characters")
    private String street;

    @NotBlank(message = "Building name is required")
    @Size(min = 2, max = 120, message = "Building name must be 2 to 120 characters")
    private String buildingName;

    @NotBlank(message = "City is required")
    @Size(min = 2, max = 80, message = "City must be 2 to 80 characters")
    private String city;

    @NotBlank(message = "State is required")
    @Size(min = 2, max = 80, message = "State must be 2 to 80 characters")
    private String state;

    @NotBlank(message = "Country is required")
    @Size(min = 2, max = 80, message = "Country must be 2 to 80 characters")
    private String country;

    @NotBlank(message = "Pincode is required")
    @Size(min = 4, max = 10, message = "Pincode must be 4 to 10 characters")
    private String pincode;
}
