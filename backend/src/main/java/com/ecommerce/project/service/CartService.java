package com.ecommerce.project.service;

import com.ecommerce.project.payload.CartDTO;

import java.util.List;

public interface CartService {
    /** Adds the product (or increases its quantity if already in the cart) for the logged-in user. */
    CartDTO addProductToCart(Long productId, Integer quantity);

    /** Admin view of every cart. */
    List<CartDTO> getAllCarts();

    /** The logged-in user's cart; an empty cart (cartId null) if none exists yet. */
    CartDTO getCurrentUserCart();

    /** Changes quantity by +1 or -1 for the logged-in user. */
    CartDTO updateProductQuantityInCart(Long productId, Integer delta);

    /** Removes an item from one of the logged-in user's carts (ownership is checked). */
    String removeProductFromUserCart(Long cartId, Long productId);

    /** Internal: removes an item without an ownership check (used by product deletion and checkout). */
    String deleteProductFromCart(Long cartId, Long productId);

    /** Internal: empties a cart after checkout. */
    void clearCart(Long cartId);

    /** Internal: refreshes the stored price of a product in a cart after the product changed. */
    void updateProductInCarts(Long cartId, Long productId);
}
