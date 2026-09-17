package com.regarsport.payment.service;

import com.regarsport.common.event.OrderCreatedEvent;
import com.regarsport.common.exception.ResourceNotFoundException;
import com.regarsport.payment.dto.PaymentResponse;
import com.regarsport.payment.entity.PaymentStatus;
import com.regarsport.payment.entity.PaymentTransaction;
import com.regarsport.payment.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentService Unit Tests")
class PaymentServiceTest {

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private MidtransService midtransService;

    @InjectMocks
    private PaymentService paymentService;

    private PaymentTransaction sampleTransaction;

    @BeforeEach
    void setUp() {
        sampleTransaction = PaymentTransaction.builder()
                .id(1L)
                .orderId(10L)
                .orderNumber("REGAR-12345")
                .customerEmail("customer@regarsport.com")
                .customerName("Customer")
                .amount(new BigDecimal("350000.00"))
                .paymentStatus(PaymentStatus.PENDING)
                .snapToken("SNAP-123")
                .snapRedirectUrl("https://app.sandbox.midtrans.com/snap/v2/vtweb/SNAP-123")
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Should initialize payment transaction from OrderCreatedEvent")
    void testInitializePaymentForOrder_Success() {
        OrderCreatedEvent event = new OrderCreatedEvent(
                10L, "REGAR-12345", 1L, "Customer", "customer@regarsport.com",
                new BigDecimal("350000.00"), "Jl. Dago No. 10", List.of(), Instant.now()
        );

        when(paymentTransactionRepository.findByOrderId(10L)).thenReturn(Optional.empty());
        when(midtransService.createSnapToken(any(), any(), any(), any()))
                .thenReturn(new MidtransService.SnapResult("SNAP-123", "https://redirect-url"));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenReturn(sampleTransaction);

        PaymentResponse response = paymentService.initializePaymentForOrder(event);

        assertThat(response).isNotNull();
        assertThat(response.orderId()).isEqualTo(10L);
        assertThat(response.orderNumber()).isEqualTo("REGAR-12345");
        assertThat(response.snapToken()).isEqualTo("SNAP-123");

        verify(paymentTransactionRepository, times(1)).save(any(PaymentTransaction.class));
    }

    @Test
    @DisplayName("Should get payment by orderId when transaction exists")
    void testGetPaymentByOrderId_Success() {
        when(paymentTransactionRepository.findByOrderId(10L)).thenReturn(Optional.of(sampleTransaction));

        PaymentResponse response = paymentService.getPaymentByOrderId(10L);

        assertThat(response).isNotNull();
        assertThat(response.orderId()).isEqualTo(10L);
        assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("350000.00"));
        verify(paymentTransactionRepository, times(1)).findByOrderId(10L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when payment transaction not found")
    void testGetPaymentByOrderId_NotFound() {
        when(paymentTransactionRepository.findByOrderId(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getPaymentByOrderId(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Payment transaction not found for orderId: 999");
    }
}
