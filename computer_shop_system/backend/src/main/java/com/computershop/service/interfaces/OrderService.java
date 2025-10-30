package com.computershop.service.interfaces;

import com.computershop.dto.request.OrderRequest;
import com.computershop.dto.response.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface OrderService {
    
    /**
     * Lấy tất cả đơn hàng với phân trang
     */
    Page<OrderResponse> getAllOrders(Pageable pageable);
    
    /**
     * Lấy đơn hàng theo user
     */
    Page<OrderResponse> getOrdersByUser(Long userId, Pageable pageable);
    
    /**
     * Lấy chi tiết đơn hàng theo ID
     */
    OrderResponse getOrderById(Long id);
    
    /**
     * Lấy đơn hàng theo order code (public access)
     */
    OrderResponse getOrderByCode(String orderCode);
    
    /**
     * Lấy đơn hàng theo trạng thái
     */
    Page<OrderResponse> getOrdersByStatus(String status, Pageable pageable);
    
    /**
     * Tạo đơn hàng từ giỏ hàng
     */
    OrderResponse createOrderFromCart(Long userId, OrderRequest request);
    
    /**
     * Cập nhật trạng thái đơn hàng
     */
    OrderResponse updateOrderStatus(Long id, String status);
    
    /**
     * Hủy đơn hàng
     */
    OrderResponse cancelOrder(Long id);
    
    /**
     * Lấy đơn hàng theo khoảng thời gian
     */
    Page<OrderResponse> getOrdersByDateRange(String startDate, String endDate, Pageable pageable);
    
    /**
     * Thống kê tổng doanh thu
     */
    Double getTotalRevenue();
    
    /**
     * Đếm số đơn hàng theo trạng thái
     */
    Long countOrdersByStatus(String status);

    /**
     * Kiểm tra xem một order có thuộc về userId hay không (dùng cho SpEL @orderService.isOrderOwner)
     */
    boolean isOrderOwner(Long orderId, Long userId);
}
