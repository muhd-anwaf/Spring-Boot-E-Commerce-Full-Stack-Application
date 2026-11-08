package com.ecommerce.project.service;

import com.ecommerce.project.payload.OrderDTO;
import com.ecommerce.project.payload.OrderResponse;

public interface OrderService {
    /** Creates an order from the user's cart. paymentMethod is MOCK_CARD or COD. */
    OrderDTO placeOrder(String emailId, Long addressId, String paymentMethod);

    OrderResponse getMyOrders(String emailId, Integer pageNumber, Integer pageSize);

    /** Returns the order if it belongs to the user, or to anyone when admin is true. */
    OrderDTO getOrder(Long orderId, String emailId, boolean admin);

    /** A user may cancel their own order while it is still PLACED; stock is returned. */
    OrderDTO cancelOrder(Long orderId, String emailId);

    OrderResponse getAllOrders(Integer pageNumber, Integer pageSize);

    OrderDTO updateStatus(Long orderId, String status);
}
