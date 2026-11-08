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
@Table(name = "addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long addressId;

    @NotBlank
    @Size(min = 3, max = 120, message = "Street must be 3 to 120 characters")
    private String street;

    @NotBlank
    @Size(min = 2, max = 120, message = "Building name must be 2 to 120 characters")
    private String buildingName;

    @NotBlank
    @Size(min = 2, max = 80, message = "City must be 2 to 80 characters")
    private String city;

    @NotBlank
    @Size(min = 2, max = 80, message = "State must be 2 to 80 characters")
    private String state;

    @NotBlank
    @Size(min = 2, max = 80, message = "Country must be 2 to 80 characters")
    private String country;

    @NotBlank
    @Size(min = 4, max = 10, message = "Pincode must be 4 to 10 characters")
    private String pincode;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Address(String street, String buildingName, String city, String state, String country, String pincode) {
        this.street = street;
        this.buildingName = buildingName;
        this.city = city;
        this.state = state;
        this.country = country;
        this.pincode = pincode;
    }
}
