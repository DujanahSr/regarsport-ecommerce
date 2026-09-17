package com.regarsport.catalog.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
    Long id,
    Long categoryId,
    String categoryName,
    String name,
    String description,
    BigDecimal price,
    Integer stock,
    String imageUrl,
    Instant createdAt,
    Instant updatedAt
) implements Serializable {}
