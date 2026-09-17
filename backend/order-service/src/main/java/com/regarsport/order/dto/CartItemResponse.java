package com.regarsport.order.dto;

import java.math.BigDecimal;

public record CartItemResponse(
    Long id,
    Long userId,
    Long productId,
    String productName,
    String productImage,
    String size,
    BigDecimal price,
    Integer quantity,
    BigDecimal subtotal
) {
    public CartItemResponse(Long id, Long userId, Long productId, String productName, String productImage, BigDecimal price, Integer quantity, BigDecimal subtotal) {
        this(id, userId, productId, productName, productImage, "L", price, quantity, subtotal);
    }
}
