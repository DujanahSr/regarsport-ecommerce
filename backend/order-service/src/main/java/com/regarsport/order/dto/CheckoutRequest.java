package com.regarsport.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CheckoutRequest(
    @NotBlank(message = "Shipping address cannot be blank")
    String shippingAddress,

    @NotEmpty(message = "Checkout items cannot be empty")
    @Valid
    List<CheckoutItemRequest> items
) {}
