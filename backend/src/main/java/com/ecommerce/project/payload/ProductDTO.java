package com.ecommerce.project.payload;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private Long productId;

    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 120, message = "Product name must be 3 to 120 characters")
    private String productName;

    /** Full image URL in responses; ignored on input (use the image upload endpoint). */
    private String image;

    @NotBlank(message = "Description is required")
    @Size(min = 6, max = 255, message = "Description must be 6 to 255 characters")
    private String description;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;

    @Positive(message = "Price must be greater than 0")
    private double price;

    @DecimalMin(value = "0", message = "Discount cannot be negative")
    @DecimalMax(value = "100", message = "Discount cannot exceed 100")
    private double discount;

    /** Calculated by the server from price and discount; ignored on input. */
    private double specialPrice;

    /** Output only. */
    private Long categoryId;

    /** Output only. */
    private String categoryName;
}
