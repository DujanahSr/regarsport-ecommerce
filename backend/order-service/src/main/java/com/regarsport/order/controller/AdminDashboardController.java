package com.regarsport.order.controller;

import com.regarsport.common.dto.ApiResponse;
import com.regarsport.order.entity.Order;
import com.regarsport.order.entity.OrderStatus;
import com.regarsport.order.repository.OrderRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Admin Order Analytics", description = "Endpoints for admin order dashboard analytics and CSV export")
@SecurityRequirement(name = "bearerAuth")
public class AdminDashboardController {

    private final OrderRepository orderRepository;

    private static final List<OrderStatus> REVENUE_STATUSES = List.of(
            OrderStatus.PAID,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.COMPLETED
    );

    @GetMapping("/api/v1/orders/admin/dashboard")
    @Operation(summary = "Admin: Get real order analytics", description = "Retrieve live revenue, order breakdown, monthly sales, and top products")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue(REVENUE_STATUSES);
        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        long paidOrders = orderRepository.countByStatus(OrderStatus.PAID);
        long processingOrders = orderRepository.countByStatus(OrderStatus.PROCESSING);
        long shippedOrders = orderRepository.countByStatus(OrderStatus.SHIPPED);
        long completedOrders = orderRepository.countByStatus(OrderStatus.COMPLETED);
        long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED);

        // Fetch top 5 products
        List<Object[]> topProductsRaw = orderRepository.findTopSellingProducts(REVENUE_STATUSES, PageRequest.of(0, 5));
        List<Map<String, Object>> topProducts = new ArrayList<>();
        for (Object[] row : topProductsRaw) {
            String name = (String) row[0];
            Number sales = (Number) row[1];
            topProducts.add(Map.of("name", name, "sales", sales != null ? sales.longValue() : 0L));
        }

        // Calculate last 6 months sales
        List<Order> allOrders = orderRepository.findAllWithItemsOrderByCreatedAtDesc();
        Map<String, BigDecimal> monthSalesMap = new LinkedHashMap<>();

        LocalDate now = LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = now.minusMonths(i);
            String monthName = monthDate.getMonth().getDisplayName(TextStyle.SHORT, new Locale("id", "ID"));
            monthSalesMap.put(monthName, BigDecimal.ZERO);
        }

        for (Order order : allOrders) {
            if (REVENUE_STATUSES.contains(order.getStatus()) && order.getCreatedAt() != null) {
                LocalDate orderDate = order.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
                String monthName = orderDate.getMonth().getDisplayName(TextStyle.SHORT, new Locale("id", "ID"));
                if (monthSalesMap.containsKey(monthName)) {
                    monthSalesMap.put(monthName, monthSalesMap.get(monthName).add(order.getTotalAmount()));
                }
            }
        }

        List<Map<String, Object>> salesData = new ArrayList<>();
        monthSalesMap.forEach((month, sales) -> salesData.add(Map.of("month", month, "sales", sales)));

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        stats.put("totalOrders", totalOrders);
        stats.put("pendingOrders", pendingOrders);
        stats.put("paidOrders", paidOrders);
        stats.put("processingOrders", processingOrders);
        stats.put("shippedOrders", shippedOrders);
        stats.put("completedOrders", completedOrders);
        stats.put("cancelledOrders", cancelledOrders);
        stats.put("topProducts", topProducts);
        stats.put("salesData", salesData);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping(value = {"/api/v1/orders/admin/export", "/api/v1/admin/orders/export"}, produces = "text/csv; charset=UTF-8")
    @Operation(summary = "Admin: Export orders as CSV", description = "Download orders report as CSV file")
    public void exportOrdersToCsv(HttpServletResponse response) throws IOException {
        String filename = "laporan-pesanan-regarstore-" + LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + ".csv";
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        List<Order> orders = orderRepository.findAllWithItemsOrderByCreatedAtDesc();

        PrintWriter writer = response.getWriter();
        // UTF-8 BOM for Excel compatibility
        writer.write('\ufeff');

        // Excel delimiter directive: instructs Excel to cleanly split columns by semicolon
        writer.println("sep=;");

        // CSV Header
        writer.println("No;Nomor Pesanan;Nama Pelanggan;Email;Status Pesanan;Kurir / Ekspedisi;Nomor Resi;Total Pembayaran (Rp);Tanggal Transaksi");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

        int index = 1;
        for (Order o : orders) {
            String courier = o.getShippingCourier() != null ? escapeCsv(o.getShippingCourier()) : "-";
            String tracking = o.getTrackingNumber() != null ? escapeCsv(o.getTrackingNumber()) : "-";
            String dateStr = o.getCreatedAt() != null ? dtf.format(o.getCreatedAt()) : "-";
            String statusStr = o.getStatus() != null ? o.getStatus().name() : "-";
            long amount = o.getTotalAmount() != null ? o.getTotalAmount().longValue() : 0L;

            writer.printf("%d;\"%s\";\"%s\";\"%s\";\"%s\";\"%s\";\"%s\";%d;\"%s\"%n",
                    index++,
                    escapeCsv(o.getOrderNumber()),
                    escapeCsv(o.getCustomerName()),
                    escapeCsv(o.getCustomerEmail()),
                    statusStr,
                    courier,
                    tracking,
                    amount,
                    dateStr
            );
        }

        writer.flush();
    }

    private String escapeCsv(String input) {
        if (input == null) return "";
        return input.replace("\"", "\"\"");
    }
}
