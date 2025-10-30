package com.computershop.controller;

import com.computershop.dto.request.OrderRequest;
import com.computershop.dto.response.ApiResponse;
import com.computershop.dto.response.OrderResponse;
import com.computershop.service.interfaces.OrderService;
import com.computershop.util.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    
    private final OrderService orderService;
    private final JwtUtils jwtUtils;
    
    /**
     * Lấy tất cả đơn hàng với phân trang
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(Pageable pageable) {
        Page<OrderResponse> orders = orderService.getAllOrders(pageable);
        return ResponseEntity.ok(ApiResponse.<Page<OrderResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách đơn hàng thành công")
                .data(orders)
                .build());
    }
    
    /**
     * Lấy đơn hàng của user hiện tại (lấy userId từ JWT token)
     */
    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getMyOrders(Pageable pageable) {
        Long userId = jwtUtils.getCurrentUserId();
        Page<OrderResponse> orders = orderService.getOrdersByUser(userId, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<OrderResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy đơn hàng của người dùng thành công")
                .data(orders)
                .build());
    }
    
    /**
     * Lấy chi tiết đơn hàng theo ID
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or @orderService.isOrderOwner(#id, @jwtUtils.getCurrentUserId())")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        OrderResponse order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy thông tin đơn hàng thành công")
                .data(order)
                .build());
    }
    
    /**
     * Tra cứu đơn hàng theo order code (public access)
     */
    @GetMapping("/code/{orderCode}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByCode(@PathVariable String orderCode) {
        OrderResponse order = orderService.getOrderByCode(orderCode);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Tra cứu đơn hàng thành công")
                .data(order)
                .build());
    }
    
    /**
     * Lấy đơn hàng theo trạng thái
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getOrdersByStatus(
            @PathVariable String status, Pageable pageable) {
        Page<OrderResponse> orders = orderService.getOrdersByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<OrderResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy đơn hàng theo trạng thái thành công")
                .data(orders)
                .build());
    }

    /**
     * Lấy đơn hàng của một user (dành cho STAFF và ADMIN). Accepts JSON body: { "user_id": 123 }
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    @PostMapping("/by-user")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getOrdersByUserId(
            @RequestBody java.util.Map<String, Long> body,
            Pageable pageable) {
        Long userId = body.get("user_id");
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.<Page<OrderResponse>>builder()
                    .statusCode(HttpStatus.BAD_REQUEST.value())
                    .message("Missing required field: user_id")
                    .build());
        }

        Page<OrderResponse> orders = orderService.getOrdersByUser(userId, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<OrderResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy đơn hàng của người dùng thành công")
                .data(orders)
                .build());
    }
    
    /**
     * Tạo đơn hàng từ giỏ hàng (lấy userId từ JWT token)
     */
    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/from-cart")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrderFromCart(
            @Valid @RequestBody OrderRequest request) {
        Long userId = jwtUtils.getCurrentUserId();
        OrderResponse order = orderService.createOrderFromCart(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<OrderResponse>builder()
                        .statusCode(HttpStatus.CREATED.value())
                        .message("Tạo đơn hàng thành công")
                        .data(order)
                        .build());
    }
    
    /**
     * Cập nhật trạng thái đơn hàng
     */
        @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
        @PostMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        OrderResponse order = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Cập nhật trạng thái đơn hàng thành công")
                .data(order)
                .build());
    }
    
    /**
     * Hủy đơn hàng
     */
        @PreAuthorize("hasRole('ADMIN') or @orderService.isOrderOwner(#id, @jwtUtils.getCurrentUserId())")
        @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(@PathVariable Long id) {
        OrderResponse order = orderService.cancelOrder(id);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Hủy đơn hàng thành công")
                .data(order)
                .build());
    }
}
