package com.regarsport.order.service;

import com.regarsport.common.exception.BadRequestException;
import com.regarsport.common.exception.ResourceNotFoundException;
import com.regarsport.order.dto.WarrantyClaimRequest;
import com.regarsport.order.dto.WarrantyClaimResponse;
import com.regarsport.order.entity.Order;
import com.regarsport.order.entity.WarrantyClaim;
import com.regarsport.order.repository.OrderRepository;
import com.regarsport.order.repository.WarrantyClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WarrantyClaimService {

    private final WarrantyClaimRepository claimRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public WarrantyClaimResponse createClaim(Long userId, WarrantyClaimRequest request) {
        log.info("Creating warranty claim for userId: {}, orderId: {}, productId: {}", userId, request.orderId(), request.productId());

        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan tidak ditemukan dengan id: " + request.orderId()));

        if (!order.getUserId().equals(userId)) {
            throw new BadRequestException("Anda hanya dapat mengajukan klaim untuk pesanan milik sendiri");
        }

        // Generate unique claim ticket number: CLM-YYYYMMDD-XXXX
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        String claimNumber = "CLM-" + datePart + "-" + randomPart;

        WarrantyClaim claim = WarrantyClaim.builder()
                .claimNumber(claimNumber)
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber() != null ? order.getOrderNumber() : request.orderNumber())
                .userId(userId)
                .productId(request.productId())
                .productName(request.productName())
                .productImage(request.productImage())
                .category(request.category().toUpperCase())
                .solution(request.solution().toUpperCase())
                .requestedSize(request.requestedSize())
                .description(request.description())
                .evidenceImages(request.evidenceImages())
                .status("PENDING")
                .build();

        WarrantyClaim saved = claimRepository.save(claim);
        log.info("Warranty claim created successfully: {}", saved.getClaimNumber());
        return toResponse(saved);
    }

    public List<WarrantyClaimResponse> getUserClaims(Long userId) {
        return claimRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<WarrantyClaimResponse> getClaimsByOrder(Long orderId) {
        return claimRepository.findByOrderIdOrderByCreatedAtDesc(orderId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public WarrantyClaimResponse getClaimByNumber(String claimNumber) {
        WarrantyClaim claim = claimRepository.findByClaimNumber(claimNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Tiket klaim tidak ditemukan: " + claimNumber));
        return toResponse(claim);
    }

    private WarrantyClaimResponse toResponse(WarrantyClaim c) {
        return new WarrantyClaimResponse(
                c.getId(),
                c.getClaimNumber(),
                c.getOrderId(),
                c.getOrderNumber(),
                c.getUserId(),
                c.getProductId(),
                c.getProductName(),
                c.getProductImage(),
                c.getCategory(),
                c.getSolution(),
                c.getRequestedSize(),
                c.getDescription(),
                c.getEvidenceImages(),
                c.getStatus(),
                c.getAdminNotes(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
