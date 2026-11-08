package com.ecommerce.project.model;

import java.util.List;

/** Allowed values of {@link Order#getOrderStatus()}. Stored as plain strings. */
public final class OrderStatus {
    public static final String PLACED = "PLACED";
    public static final String PROCESSING = "PROCESSING";
    public static final String SHIPPED = "SHIPPED";
    public static final String DELIVERED = "DELIVERED";
    public static final String CANCELLED = "CANCELLED";

    public static final List<String> ALL = List.of(PLACED, PROCESSING, SHIPPED, DELIVERED, CANCELLED);

    private OrderStatus() {
    }
}
