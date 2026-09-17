package com.regarsport.common.event;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

public record PaymentStatusUpdatedEvent(
    Long orderId,
    String orderNumber,
    String paymentStatus,
    String paymentType,
    BigDecimal amount,
    Instant paidAt
) implements Serializable {}
