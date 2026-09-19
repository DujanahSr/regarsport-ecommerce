package com.regarsport.order.service;

import com.regarsport.common.dto.PageResponse;
import com.regarsport.common.event.OrderCreatedEvent;
import com.regarsport.common.event.OrderItemEventPayload;
import com.regarsport.common.event.PaymentStatusUpdatedEvent;
import com.regarsport.common.exception.BadRequestException;
import com.regarsport.common.exception.ResourceNotFoundException;
import com.regarsport.order.dto.*;
import com.regarsport.order.entity.Order;
import com.regarsport.order.entity.OrderItem;
import com.regarsport.order.entity.OrderStatus;
import com.regarsport.order.entity.Voucher;
import com.regarsport.order.mapper.OrderMapper;
import com.regarsport.order.messaging.OrderEventProducer;
import com.regarsport.order.repository.CartItemRepository;
import com.regarsport.order.repository.OrderRepository;
import com.regarsport.order.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final VoucherRepository voucherRepository;
    private final OrderMapper orderMapper;
    private final OrderEventProducer orderEventProducer;

    @Transactional
    public OrderResponse checkout(Long userId, String customerName, String customerEmail, CheckoutRequest request) {
        log.info("Processing checkout for userId: {}, items count: {}", userId, request.items().size());

        if (request.items().isEmpty()) {
            throw new BadRequestException("Cannot checkout with empty items list");
        }

        String orderNumber = "REGAR-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItemEventPayload> eventItems = new ArrayList<>();
        List<Long> productIds = new ArrayList<>();

        String recipient = (request.recipientName() != null && !request.recipientName().isBlank())
                ? request.recipientName().trim()
                : customerName;

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .userId(userId)
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(request.customerPhone() != null ? request.customerPhone().trim() : null)
                .recipientName(recipient)
                .shippingAddress(request.shippingAddress().trim())
                .shippingCity(request.shippingCity() != null ? request.shippingCity().trim() : null)
                .shippingPostalCode(request.shippingPostalCode() != null ? request.shippingPostalCode().trim() : null)
                .shippingNotes(request.shippingNotes() != null ? request.shippingNotes().trim() : null)
                .status(OrderStatus.PENDING)
                .build();

        for (CheckoutItemRequest itemReq : request.items()) {
            BigDecimal subtotal = itemReq.price().multiply(BigDecimal.valueOf(itemReq.quantity()));
            totalAmount = totalAmount.add(subtotal);

            String itemSize = (itemReq.size() != null && !itemReq.size().isBlank()) ? itemReq.size().trim() : "L";

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .productId(itemReq.productId())
                    .productName(itemReq.productName())
                    .productImage(itemReq.productImage())
                    .size(itemSize)
                    .customName(itemReq.customName() != null ? itemReq.customName().trim().toUpperCase() : null)
                    .customNumber(itemReq.customNumber() != null ? itemReq.customNumber().trim() : null)
                    .customCollar(itemReq.customCollar() != null ? itemReq.customCollar().trim() : null)
                    .customTeam(itemReq.customTeam() != null ? itemReq.customTeam().trim().toUpperCase() : null)
                    .price(itemReq.price())
                    .quantity(itemReq.quantity())
                    .subtotal(subtotal)
                    .build();

            order.addItem(orderItem);
            productIds.add(itemReq.productId());

            eventItems.add(new OrderItemEventPayload(
                    itemReq.productId(),
                    itemReq.productName(),
                    itemReq.quantity(),
                    itemReq.price(),
                    itemSize,
                    orderItem.getCustomName(),
                    orderItem.getCustomNumber(),
                    orderItem.getCustomCollar(),
                    orderItem.getCustomTeam()
            ));
        }

        // Voucher promo discount computation
        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedVoucher = null;

        if (request.voucherCode() != null && !request.voucherCode().isBlank()) {
            Voucher voucher = voucherRepository.findByCodeIgnoreCase(request.voucherCode().trim())
                    .orElseThrow(() -> new BadRequestException("Kode voucher '" + request.voucherCode() + "' tidak ditemukan"));

            if (Boolean.FALSE.equals(voucher.getIsActive())) {
                throw new BadRequestException("Kupon promo sudah tidak aktif");
            }
            if (voucher.getValidUntil() != null && voucher.getValidUntil().isBefore(Instant.now())) {
                throw new BadRequestException("Kupon promo sudah kedaluwarsa");
            }
            if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
                throw new BadRequestException("Kuota kupon promo sudah habis");
            }
            if (voucher.getMinSpend() != null && totalAmount.compareTo(voucher.getMinSpend()) < 0) {
                throw new BadRequestException("Total belanja belum memenuhi syarat minimal belanja Rp " + voucher.getMinSpend().intValue());
            }

            if ("PERCENTAGE".equalsIgnoreCase(voucher.getDiscountType())) {
                BigDecimal pct = voucher.getDiscountValue().divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP);
                discountAmount = totalAmount.multiply(pct).setScale(0, java.math.RoundingMode.HALF_UP);
                if (voucher.getMaxDiscount() != null && discountAmount.compareTo(voucher.getMaxDiscount()) > 0) {
                    discountAmount = voucher.getMaxDiscount();
                }
            } else {
                discountAmount = voucher.getDiscountValue();
            }

            if (discountAmount.compareTo(totalAmount) > 0) {
                discountAmount = totalAmount;
            }

            appliedVoucher = voucher.getCode();
            voucher.setUsedCount(voucher.getUsedCount() + 1);
            voucherRepository.save(voucher);
        }

        BigDecimal finalTotal = totalAmount.subtract(discountAmount);
        order.setTotalAmount(finalTotal);
        order.setVoucherCode(appliedVoucher);
        order.setDiscountAmount(discountAmount);

        Order savedOrder = orderRepository.save(order);

        // Remove purchased items from the user's shopping cart
        try {
            cartItemRepository.deleteByUserIdAndProductIdIn(userId, productIds);
        } catch (Exception e) {
            log.warn("Failed to auto-clean cart items after checkout for userId: {}", userId, e);
        }

        // Publish OrderCreatedEvent to RabbitMQ
        OrderCreatedEvent event = new OrderCreatedEvent(
                savedOrder.getId(),
                savedOrder.getOrderNumber(),
                savedOrder.getUserId(),
                savedOrder.getCustomerName(),
                savedOrder.getCustomerEmail(),
                savedOrder.getTotalAmount(),
                savedOrder.getShippingAddress(),
                eventItems,
                Instant.now()
        );
        orderEventProducer.publishOrderCreated(event);

        return orderMapper.toResponse(savedOrder);
    }

    public OrderResponse getOrderById(Long orderId, Long userId, boolean isAdmin) {
        log.info("Fetching order by id: {}", orderId);
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new BadRequestException("Access denied: You can only view your own orders");
        }

        return orderMapper.toResponse(order);
    }

    public PageResponse<OrderResponse> getMyOrders(Long userId, int page, int size) {
        log.info("Fetching orders for userId: {}, page: {}, size: {}", userId, page, size);
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(50, Math.max(1, size)), Sort.by("createdAt").descending());

        Page<Order> orderPage = orderRepository.findByUserId(userId, pageable);
        var content = orderPage.getContent().stream().map(orderMapper::toResponse).toList();

        return new PageResponse<>(
                content,
                orderPage.getNumber() + 1,
                orderPage.getSize(),
                orderPage.getTotalElements(),
                orderPage.getTotalPages(),
                orderPage.isFirst(),
                orderPage.isLast()
        );
    }

    public PageResponse<OrderResponse> getAllOrders(OrderStatus status, int page, int size) {
        log.info("Admin fetching all orders with status filter: {}, page: {}, size: {}", status, page, size);
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(100, Math.max(1, size)), Sort.by("createdAt").descending());

        Page<Order> orderPage = status != null
                ? orderRepository.findByStatus(status, pageable)
                : orderRepository.findAll(pageable);

        var content = orderPage.getContent().stream().map(orderMapper::toResponse).toList();

        return new PageResponse<>(
                content,
                orderPage.getNumber() + 1,
                orderPage.getSize(),
                orderPage.getTotalElements(),
                orderPage.getTotalPages(),
                orderPage.isFirst(),
                orderPage.isLast()
        );
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        log.info("Updating order status for id: {} to: {}", orderId, newStatus);
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        order.setStatus(newStatus);
        if (newStatus == OrderStatus.SHIPPED && order.getShippedAt() == null) {
            order.setShippedAt(Instant.now());
        } else if (newStatus == OrderStatus.COMPLETED && order.getCompletedAt() == null) {
            order.setCompletedAt(Instant.now());
        }

        Order updated = orderRepository.save(order);
        return orderMapper.toResponse(updated);
    }

    @Transactional
    public OrderResponse shipOrder(Long orderId, com.regarsport.order.dto.ShipOrderRequest request) {
        log.info("Shipping order id: {} with courier: {}, tracking: {}", orderId, request.courier(), request.trackingNumber());
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        order.setStatus(OrderStatus.SHIPPED);
        order.setShippingCourier(request.courier().trim());
        order.setTrackingNumber(request.trackingNumber().trim());
        order.setShippedAt(Instant.now());

        Order updated = orderRepository.save(order);

        // Publish OrderShippedEvent to RabbitMQ
        try {
            orderEventProducer.publishOrderShipped(new com.regarsport.common.event.OrderShippedEvent(
                    updated.getId(),
                    updated.getOrderNumber(),
                    updated.getCustomerName(),
                    updated.getCustomerEmail(),
                    updated.getShippingCourier(),
                    updated.getTrackingNumber(),
                    updated.getShippedAt()
            ));
        } catch (Exception e) {
            log.warn("Failed to publish OrderShippedEvent for orderId: {}", orderId, e);
        }

        return orderMapper.toResponse(updated);
    }

    @Transactional
    public OrderResponse completeOrder(Long orderId) {
        log.info("Completing order id: {}", orderId);
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        order.setStatus(OrderStatus.COMPLETED);
        order.setCompletedAt(Instant.now());

        Order updated = orderRepository.save(order);
        return orderMapper.toResponse(updated);
    }

    @Transactional
    public void handlePaymentStatusUpdated(PaymentStatusUpdatedEvent event) {
        log.info("Handling PaymentStatusUpdatedEvent for orderId: {}, status: {}", event.orderId(), event.paymentStatus());

        Order order = orderRepository.findById(event.orderId()).orElse(null);
        if (order == null) {
            log.warn("Order not found with id: {} during payment status update event", event.orderId());
            return;
        }

        if ("PAID".equalsIgnoreCase(event.paymentStatus()) || "SETTLEMENT".equalsIgnoreCase(event.paymentStatus())) {
            order.setStatus(OrderStatus.PAID);
        } else if ("EXPIRE".equalsIgnoreCase(event.paymentStatus()) || "CANCEL".equalsIgnoreCase(event.paymentStatus())) {
            order.setStatus(OrderStatus.CANCELLED);
        }

        orderRepository.save(order);
        log.info("Successfully updated order id: {} to status: {}", order.getId(), order.getStatus());
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long userId, boolean isAdmin, String reason) {
        log.info("Cancelling order id: {} by userId: {}, isAdmin: {}", orderId, userId, isAdmin);
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new BadRequestException("Akses ditolak: Anda hanya dapat membatalkan pesanan milik Anda sendiri");
        }

        if (order.getStatus() != OrderStatus.PENDING && !isAdmin) {
            throw new BadRequestException("Hanya pesanan berstatus PENDING yang dapat dibatalkan mandiri oleh pembeli");
        }

        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.COMPLETED) {
            throw new BadRequestException("Pesanan yang sudah dikirim atau selesai tidak dapat dibatalkan");
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(reason != null && !reason.isBlank() ? reason.trim() : "Dibatalkan oleh pelanggan");

        Order updated = orderRepository.save(order);
        return orderMapper.toResponse(updated);
    }

    public VoucherValidateResponse validateVoucher(VoucherValidateRequest request) {
        String code = request.code().trim();
        BigDecimal subtotal = request.subtotal();

        Voucher voucher = voucherRepository.findByCodeIgnoreCase(code).orElse(null);
        if (voucher == null) {
            return new VoucherValidateResponse(false, "Kode voucher tidak ditemukan", code, null, BigDecimal.ZERO, BigDecimal.ZERO, subtotal);
        }
        if (Boolean.FALSE.equals(voucher.getIsActive())) {
            return new VoucherValidateResponse(false, "Kupon promo sudah tidak aktif", code, null, BigDecimal.ZERO, BigDecimal.ZERO, subtotal);
        }
        if (voucher.getValidUntil() != null && voucher.getValidUntil().isBefore(Instant.now())) {
            return new VoucherValidateResponse(false, "Kupon promo sudah kedaluwarsa", code, null, BigDecimal.ZERO, BigDecimal.ZERO, subtotal);
        }
        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            return new VoucherValidateResponse(false, "Kuota pemakaian kupon promo sudah habis", code, null, BigDecimal.ZERO, BigDecimal.ZERO, subtotal);
        }
        if (voucher.getMinSpend() != null && subtotal.compareTo(voucher.getMinSpend()) < 0) {
            return new VoucherValidateResponse(false, "Minimal belanja untuk kupon ini adalah Rp " + voucher.getMinSpend().intValue(), code, null, BigDecimal.ZERO, BigDecimal.ZERO, subtotal);
        }

        BigDecimal discount = BigDecimal.ZERO;
        if ("PERCENTAGE".equalsIgnoreCase(voucher.getDiscountType())) {
            BigDecimal pct = voucher.getDiscountValue().divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP);
            discount = subtotal.multiply(pct).setScale(0, java.math.RoundingMode.HALF_UP);
            if (voucher.getMaxDiscount() != null && discount.compareTo(voucher.getMaxDiscount()) > 0) {
                discount = voucher.getMaxDiscount();
            }
        } else {
            discount = voucher.getDiscountValue();
        }

        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }

        BigDecimal finalAmount = subtotal.subtract(discount);
        return new VoucherValidateResponse(true, "Kupon promo berhasil diterapkan!", voucher.getCode(), voucher.getDiscountType(), voucher.getDiscountValue(), discount, finalAmount);
    }

    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAll(Sort.by("createdAt").descending()).stream()
                .map(this::toVoucherResponse)
                .toList();
    }

    @Transactional
    public VoucherResponse createVoucher(VoucherRequest request) {
        if (voucherRepository.existsByCodeIgnoreCase(request.code().trim())) {
            throw new BadRequestException("Kode voucher '" + request.code() + "' sudah ada");
        }
        Voucher voucher = Voucher.builder()
                .code(request.code().trim().toUpperCase())
                .name(request.name().trim())
                .discountType(request.discountType() != null ? request.discountType().toUpperCase() : "PERCENTAGE")
                .discountValue(request.discountValue())
                .minSpend(request.minSpend() != null ? request.minSpend() : BigDecimal.ZERO)
                .maxDiscount(request.maxDiscount())
                .usageLimit(request.usageLimit() != null ? request.usageLimit() : 100)
                .usedCount(0)
                .isActive(request.isActive() != null ? request.isActive() : true)
                .validUntil(request.validUntil())
                .build();
        return toVoucherResponse(voucherRepository.save(voucher));
    }

    @Transactional
    public VoucherResponse toggleVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher tidak ditemukan dengan id: " + id));
        voucher.setIsActive(!Boolean.TRUE.equals(voucher.getIsActive()));
        return toVoucherResponse(voucherRepository.save(voucher));
    }

    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher tidak ditemukan dengan id: " + id));
        voucherRepository.delete(voucher);
    }

    private VoucherResponse toVoucherResponse(Voucher v) {
        return new VoucherResponse(
                v.getId(),
                v.getCode(),
                v.getName(),
                v.getDiscountType(),
                v.getDiscountValue(),
                v.getMinSpend(),
                v.getMaxDiscount(),
                v.getUsageLimit(),
                v.getUsedCount(),
                v.getIsActive(),
                v.getValidUntil(),
                v.getCreatedAt()
        );
    }
}
