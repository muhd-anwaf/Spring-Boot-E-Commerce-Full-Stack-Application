package com.ecommerce.project.util;

import com.ecommerce.project.model.Product;
import com.ecommerce.project.payload.ProductDTO;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Single place that turns a {@link Product} into a {@link ProductDTO} with a full image URL. */
@Component
public class ProductDtoMapper {

    private final ModelMapper modelMapper;
    private final String imageBaseUrl;

    public ProductDtoMapper(ModelMapper modelMapper, @Value("${image.base.url}") String imageBaseUrl) {
        this.modelMapper = modelMapper;
        this.imageBaseUrl = imageBaseUrl;
    }

    public ProductDTO toDto(Product product) {
        ProductDTO dto = modelMapper.map(product, ProductDTO.class);
        String image = product.getImage() == null || product.getImage().isBlank() ? "default.png" : product.getImage();
        dto.setImage(imageBaseUrl + image);
        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getCategoryId());
            dto.setCategoryName(product.getCategory().getCategoryName());
        } else {
            dto.setCategoryId(null);
            dto.setCategoryName(null);
        }
        return dto;
    }
}
