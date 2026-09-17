package com.regarsport.order.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
    Long id,
    Long productId,
    String productName,
    String productImage,
    String size,
    BigDecimal price,
    Integer quantity,
    BigDecimal subtotal
) {
    public OrderItemResponse(Long id, Long productId, String productName, String productImage, BigDecimal price, Integer quantity, BigDecimal subtotal) {
        this(id, productId, productName, productImage, "L", price, quantity, subtotal);
    }
}
