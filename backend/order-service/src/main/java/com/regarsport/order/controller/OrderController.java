package com.regarsport.order.controller;

import com.regarsport.common.dto.ApiResponse;
import com.regarsport.common.dto.PageResponse;
import com.regarsport.order.dto.CheckoutRequest;
import com.regarsport.order.dto.OrderResponse;
import com.regarsport.order.dto.OrderStatusUpdateRequest;
import com.regarsport.order.entity.OrderStatus;
import com.regarsport.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Processing", description = "Endpoints for order checkout, tracking, and status administration")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @Operation(summary = "Checkout order", description = "Create order and publish OrderCreatedEvent to RabbitMQ pipeline")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @RequestHeader(value = "X-User-Name", defaultValue = "Customer") String customerName,
            @RequestHeader(value = "X-User-Email", defaultValue = "customer@regarsport.com") String customerEmail,
            @Valid @RequestBody CheckoutRequest request
    ) {
        OrderResponse response = orderService.checkout(userId, customerName, customerEmail, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details", description = "Retrieve full order details including line items")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "ROLE_CUSTOMER") String role
    ) {
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role);
        OrderResponse response = orderService.getOrderById(id, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Get my orders", description = "Retrieve paginated order history for the logged-in user")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<OrderResponse> response = orderService.getMyOrders(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Admin: Get all orders", description = "Retrieve all platform orders with optional status filter")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<OrderResponse> response = orderService.getAllOrders(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Admin: Update order status", description = "Update the processing status of an order")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request
    ) {
        OrderResponse response = orderService.updateOrderStatus(id, request.status());
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", response));
    }

    @PatchMapping("/{id}/ship")
    @Operation(summary = "Admin: Ship order", description = "Fulfill order by adding courier name and tracking number")
    public ResponseEntity<ApiResponse<OrderResponse>> shipOrder(
            @PathVariable Long id,
            @Valid @RequestBody com.regarsport.order.dto.ShipOrderRequest request
    ) {
        OrderResponse response = orderService.shipOrder(id, request);
        return ResponseEntity.ok(ApiResponse.success("Pesanan berhasil dikirim dengan nomor resi", response));
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "Customer/Admin: Complete order", description = "Confirm order receipt and mark as completed")
    public ResponseEntity<ApiResponse<OrderResponse>> completeOrder(@PathVariable Long id) {
        OrderResponse response = orderService.completeOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Pesanan telah selesai dan berhasil diterima", response));
    }
}
