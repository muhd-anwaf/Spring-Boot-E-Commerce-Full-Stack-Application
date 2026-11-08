package com.ecommerce.project.repositories;

import com.ecommerce.project.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CartRepository extends JpaRepository<Cart, Long> {
    @Query("SELECT c FROM Cart c WHERE c.user.email = ?1")
    Cart findCartByEmail(String email);

    /** Carts that contain the product (collection is not fetched, so it is never partially loaded). */
    @Query("SELECT DISTINCT c FROM Cart c JOIN c.cartItems ci WHERE ci.product.productId = ?1")
    List<Cart> findCartsByProductId(Long productId);
}
