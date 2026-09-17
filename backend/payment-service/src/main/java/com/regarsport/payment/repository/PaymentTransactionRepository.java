package com.regarsport.payment.repository;

import com.regarsport.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByOrderId(Long orderId);
    Optional<PaymentTransaction> findByOrderNumber(String orderNumber);
    Optional<PaymentTransaction> findBySnapToken(String snapToken);
}
