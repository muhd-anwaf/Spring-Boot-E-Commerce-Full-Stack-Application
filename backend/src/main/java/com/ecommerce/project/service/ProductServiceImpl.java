package com.ecommerce.project.service;

import com.ecommerce.project.exceptions.APIException;
import com.ecommerce.project.exceptions.ResourceNotFoundException;
import com.ecommerce.project.model.Cart;
import com.ecommerce.project.model.Category;
import com.ecommerce.project.model.Product;
import com.ecommerce.project.payload.ProductDTO;
import com.ecommerce.project.payload.ProductResponse;
import com.ecommerce.project.repositories.CartRepository;
import com.ecommerce.project.repositories.CategoryRepository;
import com.ecommerce.project.repositories.OrderItemRepository;
import com.ecommerce.project.repositories.ProductRepository;
import com.ecommerce.project.util.AuthUtil;
import com.ecommerce.project.util.ProductDtoMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Service
public class ProductServiceImpl implements ProductService {

    /** Fields the public API may sort by. Anything else is rejected with 400. */
    private static final Set<String> SORTABLE_FIELDS =
            Set.of("productId", "productName", "price", "specialPrice", "quantity");
    private static final int MAX_PAGE_SIZE = 100;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ProductDtoMapper productDtoMapper;

    @Autowired
    private FileService fileService;

    @Autowired
    private AuthUtil authUtil;

    @Value("${project.image}")
    private String path;

    @Override
    @Transactional
    public ProductDTO addProduct(Long categoryId, ProductDTO productDTO) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "categoryId", categoryId));

        boolean duplicate = productRepository.existsByCategoryAndProductNameIgnoreCase(category, productDTO.getProductName());
        if (duplicate) {
            throw new APIException("Product already exists in this category");
        }

        Product product = new Product();
        applyEditableFields(product, productDTO);
        product.setImage("default.png");
        product.setCategory(category);
        product.setUser(authUtil.loggedInUser());
        return productDtoMapper.toDto(productRepository.save(product));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getAllProducts(Integer pageNumber, Integer pageSize, String sortBy, String sortOrder,
                                          String keyword, String category) {
        Pageable pageDetails = buildPageable(pageNumber, pageSize, sortBy, sortOrder);

        Specification<Product> spec = Specification.where(null);
        if (keyword != null && !keyword.isBlank()) {
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("productName")), pattern));
        }
        if (category != null && !category.isBlank()) {
            String name = category.trim().toLowerCase();
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("category").get("categoryName")), name));
        }
        return toResponse(productRepository.findAll(spec, pageDetails));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));
        return productDtoMapper.toDto(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse searchByCategory(Long categoryId, Integer pageNumber, Integer pageSize, String sortBy, String sortOrder) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "categoryId", categoryId));
        Pageable pageDetails = buildPageable(pageNumber, pageSize, sortBy, sortOrder);
        return toResponse(productRepository.findByCategory(category, pageDetails));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse searchProductByKeyword(String keyword, Integer pageNumber, Integer pageSize, String sortBy, String sortOrder) {
        Pageable pageDetails = buildPageable(pageNumber, pageSize, sortBy, sortOrder);
        return toResponse(productRepository.findByProductNameLikeIgnoreCase("%" + keyword + "%", pageDetails));
    }

    @Override
    @Transactional
    public ProductDTO updateProduct(Long productId, ProductDTO productDTO) {
        Product productFromDb = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));

        applyEditableFields(productFromDb, productDTO);
        Product savedProduct = productRepository.save(productFromDb);

        // Keep stored cart prices and totals in sync with the new price
        List<Cart> carts = cartRepository.findCartsByProductId(productId);
        carts.forEach(cart -> cartService.updateProductInCarts(cart.getCartId(), productId));

        return productDtoMapper.toDto(savedProduct);
    }

    @Override
    @Transactional
    public ProductDTO deleteProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));

        if (orderItemRepository.existsByProductProductId(productId)) {
            throw new APIException("This product is part of existing orders and cannot be deleted. Set its stock to 0 instead.");
        }

        List<Cart> carts = cartRepository.findCartsByProductId(productId);
        carts.forEach(cart -> cartService.deleteProductFromCart(cart.getCartId(), productId));

        ProductDTO dto = productDtoMapper.toDto(product);
        productRepository.delete(product);
        return dto;
    }

    @Override
    @Transactional
    public ProductDTO updateProductImage(Long productId, MultipartFile image) throws IOException {
        Product productFromDb = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));

        String fileName = fileService.uploadImage(path, image);
        productFromDb.setImage(fileName);
        return productDtoMapper.toDto(productRepository.save(productFromDb));
    }

    @Override
    @Transactional
    public ProductDTO updateProductsCategory(Long productId, Long categoryId) {
        Product productFromDb = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));
        Category categoryFromDb = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "categoryId", categoryId));
        productFromDb.setCategory(categoryFromDb);
        return productDtoMapper.toDto(productRepository.save(productFromDb));
    }

    /** Copies the fields an admin may edit and recalculates the discounted price on the server. */
    private void applyEditableFields(Product product, ProductDTO dto) {
        product.setProductName(dto.getProductName().trim());
        product.setDescription(dto.getDescription().trim());
        product.setQuantity(dto.getQuantity());
        product.setPrice(dto.getPrice());
        product.setDiscount(dto.getDiscount());
        double special = dto.getPrice() - (dto.getDiscount() * 0.01 * dto.getPrice());
        product.setSpecialPrice(Math.round(special * 100) / 100.0);
    }

    private Pageable buildPageable(Integer pageNumber, Integer pageSize, String sortBy, String sortOrder) {
        if (pageNumber == null || pageNumber < 0) {
            throw new APIException("pageNumber must be 0 or greater");
        }
        if (pageSize == null || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
            throw new APIException("pageSize must be between 1 and " + MAX_PAGE_SIZE);
        }
        if (sortBy == null || !SORTABLE_FIELDS.contains(sortBy)) {
            throw new APIException("Cannot sort by '" + sortBy + "'. Allowed: " + String.join(", ", SORTABLE_FIELDS));
        }
        Sort sort = "desc".equalsIgnoreCase(sortOrder) ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        return PageRequest.of(pageNumber, pageSize, sort);
    }

    private ProductResponse toResponse(Page<Product> page) {
        ProductResponse response = new ProductResponse();
        response.setContent(page.getContent().stream().map(productDtoMapper::toDto).toList());
        response.setPageNumber(page.getNumber());
        response.setPageSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setLastPage(page.isLast());
        return response;
    }
}
