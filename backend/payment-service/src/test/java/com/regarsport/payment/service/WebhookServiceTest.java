package com.regarsport.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.regarsport.common.event.PaymentStatusUpdatedEvent;
import com.regarsport.payment.dto.MidtransWebhookPayload;
import com.regarsport.payment.entity.PaymentStatus;
import com.regarsport.payment.entity.PaymentTransaction;
import com.regarsport.payment.entity.WebhookLog;
import com.regarsport.payment.messaging.PaymentEventProducer;
import com.regarsport.payment.repository.PaymentTransactionRepository;
import com.regarsport.payment.repository.WebhookLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WebhookService Unit Tests - Idempotency & Lifecycle")
class WebhookServiceTest {

    @Mock
    private WebhookLogRepository webhookLogRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private PaymentEventProducer paymentEventProducer;

    @Mock
    private EmailNotificationService emailNotificationService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private WebhookService webhookService;

    private PaymentTransaction sampleTransaction;
    private MidtransWebhookPayload settlementPayload;

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
                .createdAt(Instant.now())
                .build();

        settlementPayload = new MidtransWebhookPayload(
                "REGAR-12345",
                "tx-midtrans-999",
                "settlement",
                "200",
                "350000.00",
                "qris",
                "mock-sig",
                "accept",
                "2026-09-15 02:00:00"
        );
    }

    @Test
    @DisplayName("Should process settlement webhook and publish event on first attempt")
    void testProcessWebhook_Success_FirstAttempt() {
        String expectedKey = "REGAR-12345_settlement";
        when(webhookLogRepository.existsByIdempotencyKey(expectedKey)).thenReturn(false);
        when(paymentTransactionRepository.findByOrderNumber("REGAR-12345")).thenReturn(Optional.of(sampleTransaction));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenReturn(sampleTransaction);
        when(webhookLogRepository.save(any(WebhookLog.class))).thenAnswer(i -> i.getArgument(0));
        doNothing().when(paymentEventProducer).publishPaymentStatusUpdated(any(PaymentStatusUpdatedEvent.class));
        doNothing().when(emailNotificationService).sendPaymentReceiptEmail(any(), any(), any(), any(), any());

        String result = webhookService.processMidtransWebhook(settlementPayload);

        assertThat(result).isEqualTo("Webhook processed successfully");
        assertThat(sampleTransaction.getPaymentStatus()).isEqualTo(PaymentStatus.SETTLEMENT);
        assertThat(sampleTransaction.getPaidAt()).isNotNull();

        verify(paymentTransactionRepository, times(1)).save(sampleTransaction);
        verify(paymentEventProducer, times(1)).publishPaymentStatusUpdated(any(PaymentStatusUpdatedEvent.class));
        verify(emailNotificationService, times(1)).sendPaymentReceiptEmail(
                eq("customer@regarsport.com"), eq("Customer"), eq("REGAR-12345"),
                eq(new BigDecimal("350000.00")), eq("qris")
        );
    }

    @Test
    @DisplayName("Should reject duplicate webhook callback due to Idempotency Key check")
    void testProcessWebhook_Idempotency_DuplicateRejected() {
        String expectedKey = "REGAR-12345_settlement";
        when(webhookLogRepository.existsByIdempotencyKey(expectedKey)).thenReturn(true);

        String result = webhookService.processMidtransWebhook(settlementPayload);

        assertThat(result).isEqualTo("Already processed");

        // Verify that duplicate calls never re-execute transaction state update or event publishing
        verify(paymentTransactionRepository, never()).findByOrderNumber(anyString());
        verify(paymentTransactionRepository, never()).save(any());
        verify(paymentEventProducer, never()).publishPaymentStatusUpdated(any());
        verify(emailNotificationService, never()).sendPaymentReceiptEmail(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should update status to EXPIRE when order expires")
    void testProcessWebhook_ExpireStatus() {
        MidtransWebhookPayload expirePayload = new MidtransWebhookPayload(
                "REGAR-12345", "tx-midtrans-999", "expire", "200",
                "350000.00", "qris", "mock-sig", "accept", null
        );

        when(webhookLogRepository.existsByIdempotencyKey("REGAR-12345_expire")).thenReturn(false);
        when(paymentTransactionRepository.findByOrderNumber("REGAR-12345")).thenReturn(Optional.of(sampleTransaction));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenReturn(sampleTransaction);
        when(webhookLogRepository.save(any(WebhookLog.class))).thenAnswer(i -> i.getArgument(0));

        String result = webhookService.processMidtransWebhook(expirePayload);

        assertThat(result).isEqualTo("Webhook processed successfully");
        assertThat(sampleTransaction.getPaymentStatus()).isEqualTo(PaymentStatus.EXPIRE);
        verify(emailNotificationService, never()).sendPaymentReceiptEmail(any(), any(), any(), any(), any());
    }
}
