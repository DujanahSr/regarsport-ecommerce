package com.regarsport.notification.controller;

import com.regarsport.common.dto.ApiResponse;
import com.regarsport.common.event.OrderCreatedEvent;
import com.regarsport.common.event.OrderItemEventPayload;
import com.regarsport.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final EmailService emailService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "UP",
                "service", "notification-service",
                "smtpPort", 1025,
                "timestamp", Instant.now().toString()
        )));
    }

    @PostMapping("/test-email")
    public ResponseEntity<ApiResponse<String>> sendTestEmail(@RequestParam(defaultValue = "customer@regarsport.com") String email) {
        OrderCreatedEvent mockEvent = new OrderCreatedEvent(
                999L,
                "REGAR-TEST-EMAIL-001",
                1L,
                "Pelanggan Setia RegarSport",
                email,
                BigDecimal.valueOf(175000),
                "Jl. Stadion Utama No. 88, Wonogiri, Jawa Tengah",
                List.of(new OrderItemEventPayload(
                        10L,
                        "Jersey Futsal Garuda Pro Edition",
                        1,
                        BigDecimal.valueOf(175000),
                        "XL",
                        "DUJANAH",
                        "10",
                        "V-Neck",
                        "WONOGIRI FC"
                )),
                Instant.now()
        );
        emailService.sendOrderConfirmationEmail(mockEvent);
        return ResponseEntity.ok(ApiResponse.success("Test email triggered successfully to " + email, null));
    }
}
