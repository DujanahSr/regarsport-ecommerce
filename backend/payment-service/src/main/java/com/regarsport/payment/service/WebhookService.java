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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final WebhookLogRepository webhookLogRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentEventProducer paymentEventProducer;
    private final EmailNotificationService emailNotificationService;
    private final ObjectMapper objectMapper;

    @Transactional
    public String processMidtransWebhook(MidtransWebhookPayload payload) {
        String idempotencyKey = payload.orderId() + "_" + payload.transactionStatus();
        log.info("Processing Midtrans Webhook with idempotencyKey: {}", idempotencyKey);

        // Strict Webhook Idempotency Check
        if (webhookLogRepository.existsByIdempotencyKey(idempotencyKey)) {
            log.warn("Duplicate webhook callback detected for key: {}. Skipping execution to prevent duplicate transactions.", idempotencyKey);
            return "Already processed";
        }

        String rawPayload = "";
        try {
            rawPayload = objectMapper.writeValueAsString(payload);
        } catch (Exception ignored) {}

        WebhookLog logEntry = WebhookLog.builder()
                .idempotencyKey(idempotencyKey)
                .orderNumber(payload.orderId())
                .transactionStatus(payload.transactionStatus())
                .payload(rawPayload)
                .processed(false)
                .build();
        webhookLogRepository.save(logEntry);

        Optional<PaymentTransaction> txOpt = paymentTransactionRepository.findByOrderNumber(payload.orderId());
        if (txOpt.isEmpty() && payload.orderId() != null && payload.orderId().contains("-R")) {
            String baseOrderNumber = payload.orderId().substring(0, payload.orderId().lastIndexOf("-R"));
            txOpt = paymentTransactionRepository.findByOrderNumber(baseOrderNumber);
        }
        if (txOpt.isEmpty()) {
            log.warn("PaymentTransaction not found for orderNumber: {}", payload.orderId());
            return "Order transaction record not found";
        }

        PaymentTransaction transaction = txOpt.get();
        String txStatus = payload.transactionStatus() != null ? payload.transactionStatus().toLowerCase() : "";
        PaymentStatus newStatus;
        boolean isSuccess = false;

        if ("settlement".equals(txStatus) || ("capture".equals(txStatus) && "accept".equalsIgnoreCase(payload.fraudStatus()))) {
            newStatus = PaymentStatus.SETTLEMENT;
            isSuccess = true;
            transaction.setPaidAt(Instant.now());
        } else if ("expire".equals(txStatus)) {
            newStatus = PaymentStatus.EXPIRE;
        } else if ("cancel".equals(txStatus) || "deny".equals(txStatus)) {
            newStatus = PaymentStatus.CANCEL;
        } else {
            newStatus = PaymentStatus.PENDING;
        }

        transaction.setPaymentStatus(newStatus);
        transaction.setMidtransTransactionId(payload.transactionId());
        transaction.setPaymentType(payload.paymentType());
        paymentTransactionRepository.save(transaction);

        // Publish event to RabbitMQ for order-service and notification-service to consume
        PaymentStatusUpdatedEvent event = new PaymentStatusUpdatedEvent(
                transaction.getOrderId(),
                transaction.getOrderNumber(),
                isSuccess ? "PAID" : newStatus.name(),
                payload.paymentType(),
                transaction.getAmount(),
                transaction.getPaidAt() != null ? transaction.getPaidAt() : Instant.now(),
                transaction.getCustomerName(),
                transaction.getCustomerEmail()
        );
        paymentEventProducer.publishPaymentStatusUpdated(event);

        // Send confirmation email asynchronously
        if (isSuccess) {
            emailNotificationService.sendPaymentReceiptEmail(
                    transaction.getCustomerEmail(),
                    transaction.getCustomerName(),
                    transaction.getOrderNumber(),
                    transaction.getAmount(),
                    payload.paymentType()
            );
        }

        logEntry.setProcessed(true);
        webhookLogRepository.save(logEntry);

        log.info("Successfully completed processing for idempotencyKey: {}, newStatus: {}", idempotencyKey, newStatus);
        return "Webhook processed successfully";
    }
}
