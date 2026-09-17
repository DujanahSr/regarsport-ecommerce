package com.regarsport.catalog.dto;

import jakarta.validation.constraints.NotNull;

public record StockUpdateRequest(
    @NotNull(message = "Quantity change is required")
    Integer quantityChange
) {}
