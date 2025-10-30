package com.computershop.repository;

import com.computershop.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    
    /**
     * Tìm tất cả order items của một đơn hàng
     */
    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.id = :orderId")
    List<OrderItem> findByOrderId(@Param("orderId") Long orderId);
    
    /**
     * Tìm tất cả order items chứa một sản phẩm cụ thể
     */
    @Query("SELECT oi FROM OrderItem oi WHERE oi.product.id = :productId")
    List<OrderItem> findByProductId(@Param("productId") Long productId);
    
    /**
     * Tính tổng doanh thu từ order items của một đơn hàng
     */
    @Query("SELECT SUM(oi.quantity * oi.price) FROM OrderItem oi WHERE oi.order.id = :orderId")
    BigDecimal getTotalRevenueByOrderId(@Param("orderId") Long orderId);
    
    /**
     * Kiểm tra sản phẩm có tồn tại trong đơn hàng nào đã hoàn thành không
     */
    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi WHERE oi.product.id = :productId AND oi.order.status = com.computershop.entity.Order$OrderStatus.DELIVERED")
    boolean hasCompletedOrdersForProduct(@Param("productId") Long productId);
}
