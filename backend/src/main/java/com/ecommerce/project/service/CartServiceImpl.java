package com.ecommerce.project.service;

import com.ecommerce.project.exceptions.APIException;
import com.ecommerce.project.exceptions.ResourceNotFoundException;
import com.ecommerce.project.model.Cart;
import com.ecommerce.project.model.CartItem;
import com.ecommerce.project.model.Product;
import com.ecommerce.project.payload.CartDTO;
import com.ecommerce.project.payload.ProductDTO;
import com.ecommerce.project.repositories.CartItemRepository;
import com.ecommerce.project.repositories.CartRepository;
import com.ecommerce.project.repositories.ProductRepository;
import com.ecommerce.project.util.AuthUtil;
import com.ecommerce.project.util.ProductDtoMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartServiceImpl implements CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private AuthUtil authUtil;

    @Autowired
    ProductRepository productRepository;

    @Autowired
    CartItemRepository cartItemRepository;

    @Autowired
    ProductDtoMapper productDtoMapper;

    @Override
    @Transactional
    public CartDTO addProductToCart(Long productId, Integer quantity) {
        if (quantity == null || quantity < 1) {
            throw new APIException("Quantity must be at least 1");
        }
        Cart cart = getOrCreateCart();

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));

        if (product.getQuantity() == null || product.getQuantity() == 0) {
            throw new APIException(product.getProductName() + " is out of stock");
        }

        CartItem cartItem = cartItemRepository.findCartItemByProductIdAndCartId(cart.getCartId(), productId);
        int requested = quantity + (cartItem != null ? cartItem.getQuantity() : 0);
        if (product.getQuantity() < requested) {
            throw new APIException("Only " + product.getQuantity() + " of " + product.getProductName() + " in stock");
        }

        if (cartItem == null) {
            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cart.getCartItems().add(cartItem);
        }
        cartItem.setQuantity(requested);
        cartItem.setDiscount(product.getDiscount());
        cartItem.setProductPrice(product.getSpecialPrice());
        cartItemRepository.save(cartItem);

        refreshTotal(cart);
        return toCartDto(cart);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CartDTO> getAllCarts() {
        return cartRepository.findAll().stream().map(this::toCartDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CartDTO getCurrentUserCart() {
        Cart cart = cartRepository.findCartByEmail(authUtil.loggedInEmail());
        if (cart == null) {
            CartDTO empty = new CartDTO();
            empty.setTotalPrice(0.0);
            return empty;
        }
        return toCartDto(cart);
    }

    @Override
    @Transactional
    public CartDTO updateProductQuantityInCart(Long productId, Integer delta) {
        Cart cart = cartRepository.findCartByEmail(authUtil.loggedInEmail());
        if (cart == null) {
            throw new APIException("Your cart is empty");
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));

        CartItem cartItem = cartItemRepository.findCartItemByProductIdAndCartId(cart.getCartId(), productId);
        if (cartItem == null) {
            throw new APIException("Product " + product.getProductName() + " is not in your cart");
        }

        int newQuantity = cartItem.getQuantity() + delta;
        if (newQuantity < 0) {
            throw new APIException("The resulting quantity cannot be negative");
        }
        if (newQuantity == 0) {
            removeItem(cart, cartItem);
        } else {
            if (product.getQuantity() < newQuantity) {
                throw new APIException("Only " + product.getQuantity() + " of " + product.getProductName() + " in stock");
            }
            cartItem.setQuantity(newQuantity);
            cartItem.setProductPrice(product.getSpecialPrice());
            cartItem.setDiscount(product.getDiscount());
            cartItemRepository.save(cartItem);
        }
        refreshTotal(cart);
        return toCartDto(cart);
    }

    @Override
    @Transactional
    public String removeProductFromUserCart(Long cartId, Long productId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "cartId", cartId));
        if (cart.getUser() == null || !cart.getUser().getEmail().equals(authUtil.loggedInEmail())) {
            // Do not reveal that someone else's cart exists
            throw new ResourceNotFoundException("Cart", "cartId", cartId);
        }
        return deleteProductFromCart(cartId, productId);
    }

    @Override
    @Transactional
    public String deleteProductFromCart(Long cartId, Long productId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "cartId", cartId));
        CartItem cartItem = cartItemRepository.findCartItemByProductIdAndCartId(cartId, productId);
        if (cartItem == null) {
            throw new ResourceNotFoundException("Product", "productId", productId);
        }
        String name = cartItem.getProduct().getProductName();
        removeItem(cart, cartItem);
        refreshTotal(cart);
        return "Product " + name + " removed from the cart";
    }

    @Override
    @Transactional
    public void clearCart(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "cartId", cartId));
        cart.getCartItems().clear();
        cart.setTotalPrice(0.0);
        cartRepository.save(cart);
    }

    @Override
    @Transactional
    public void updateProductInCarts(Long cartId, Long productId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "cartId", cartId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));
        CartItem cartItem = cartItemRepository.findCartItemByProductIdAndCartId(cartId, productId);
        if (cartItem == null) {
            return;
        }
        cartItem.setProductPrice(product.getSpecialPrice());
        cartItem.setDiscount(product.getDiscount());
        cartItemRepository.save(cartItem);
        refreshTotal(cart);
    }

    private Cart getOrCreateCart() {
        Cart userCart = cartRepository.findCartByEmail(authUtil.loggedInEmail());
        if (userCart != null) {
            return userCart;
        }
        Cart cart = new Cart();
        cart.setTotalPrice(0.0);
        cart.setUser(authUtil.loggedInUser());
        return cartRepository.save(cart);
    }

    private void removeItem(Cart cart, CartItem cartItem) {
        cart.getCartItems().remove(cartItem);
        cartItemRepository.delete(cartItem);
        cartItemRepository.flush();
    }

    /** Recomputes the stored total from the items so it can never drift. */
    private void refreshTotal(Cart cart) {
        cartItemRepository.flush();
        Double total = cartItemRepository.sumCartTotal(cart.getCartId());
        cart.setTotalPrice(Math.round((total == null ? 0.0 : total) * 100) / 100.0);
        cartRepository.save(cart);
    }

    private CartDTO toCartDto(Cart cart) {
        CartDTO dto = new CartDTO();
        dto.setCartId(cart.getCartId());
        dto.setTotalPrice(cart.getTotalPrice());
        List<ProductDTO> products = cart.getCartItems().stream().map(item -> {
            ProductDTO productDTO = productDtoMapper.toDto(item.getProduct());
            productDTO.setQuantity(item.getQuantity()); // quantity in the cart, not stock
            productDTO.setSpecialPrice(item.getProductPrice());
            return productDTO;
        }).toList();
        dto.setProducts(products);
        return dto;
    }
}
