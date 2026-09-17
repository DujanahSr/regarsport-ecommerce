package com.regarsport.common.event;

import java.io.Serializable;
import java.math.BigDecimal;

public record OrderItemEventPayload(
    Long productId,
    String productName,
    Integer quantity,
    BigDecimal price
) implements Serializable {}
