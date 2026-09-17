package com.regarsport.order.service;

import com.regarsport.common.dto.PageResponse;
import com.regarsport.common.event.OrderCreatedEvent;
import com.regarsport.common.event.OrderItemEventPayload;
import com.regarsport.common.event.PaymentStatusUpdatedEvent;
import com.regarsport.common.exception.BadRequestException;
import com.regarsport.common.exception.ResourceNotFoundException;
import com.regarsport.order.dto.CheckoutItemRequest;
import com.regarsport.order.dto.CheckoutRequest;
import com.regarsport.order.dto.OrderResponse;
import com.regarsport.order.entity.Order;
import com.regarsport.order.entity.OrderItem;
import com.regarsport.order.entity.OrderStatus;
import com.regarsport.order.mapper.OrderMapper;
import com.regarsport.order.messaging.OrderEventProducer;
import com.regarsport.order.repository.CartItemRepository;
import com.regarsport.order.repository.OrderRepository;
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

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .userId(userId)
                .customerName(customerName)
                .customerEmail(customerEmail)
                .shippingAddress(request.shippingAddress().trim())
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
                    itemReq.price()
            ));
        }

        order.setTotalAmount(totalAmount);
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
}
