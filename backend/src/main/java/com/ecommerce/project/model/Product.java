package com.ecommerce.project.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@lombok.EqualsAndHashCode(onlyExplicitlyIncluded = true)
@lombok.ToString(onlyExplicitlyIncluded = true)
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "products")
public class Product {

    @lombok.EqualsAndHashCode.Include
    @lombok.ToString.Include
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long productId;

    @NotBlank
    @Size(min = 3, max = 120, message = "Product name must be 3 to 120 characters")
    private String productName;
    private String image;

    @NotBlank
    @Size(min = 6, max = 255, message = "Description must be 6 to 255 characters")
    private String description;
    private Integer quantity;
    private double price;
    private double discount;
    private double specialPrice;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "seller_id")
    private User user;

    // Inverse side only. No cascade (it re-persisted deleted cart items) and LAZY (EAGER caused N+1 queries).
    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    @lombok.ToString.Exclude
    private List<CartItem> products = new ArrayList<>();
}
