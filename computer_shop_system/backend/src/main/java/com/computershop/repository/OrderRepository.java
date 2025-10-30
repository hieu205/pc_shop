package com.computershop.repository;

import com.computershop.entity.Order;
import com.computershop.entity.Order.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    /**
     * Tìm đơn hàng theo order code
     */
    Optional<Order> findByOrderCode(String orderCode);
    
    /**
     * Tìm tất cả đơn hàng của một user
     */
    @Query("SELECT o FROM Order o WHERE o.user.id = :userId ORDER BY o.createdAt DESC")
    Page<Order> findOrdersByUserId(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * Tìm đơn hàng theo trạng thái
     */
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    
    /**
     * Tìm đơn hàng của user theo trạng thái
     */
    @Query("SELECT o FROM Order o WHERE o.user.id = :userId AND o.status = :status ORDER BY o.createdAt DESC")
    Page<Order> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") OrderStatus status, Pageable pageable);
    
    /**
     * Tìm đơn hàng trong khoảng thời gian
     */
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate ORDER BY o.createdAt DESC")
    List<Order> findOrdersBetweenDates(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Tính tổng doanh thu theo trạng thái đơn hàng
     */
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = :status")
    Optional<BigDecimal> getTotalRevenueByStatus(@Param("status") OrderStatus status);
    
    /**
     * Tính tổng doanh thu trong khoảng thời gian
     */
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate AND o.status = :status")
    Optional<BigDecimal> getTotalRevenueBetweenDatesAndStatus(@Param("startDate") LocalDateTime startDate, 
                                                             @Param("endDate") LocalDateTime endDate, 
                                                             @Param("status") OrderStatus status);
    
    /**
     * Đếm số đơn hàng theo trạng thái
     */
    long countByStatus(OrderStatus status);
    
    /**
     * Đếm số đơn hàng của user theo trạng thái
     */
    long countByUserIdAndStatus(Long userId, OrderStatus status);
    
    /**
     * Tìm đơn hàng gần nhất của user (derived query avoids invalid JPQL LIMIT)
     */
    Optional<Order> findFirstByUser_IdOrderByCreatedAtDesc(Long userId);

    /**
     * Safer native-query variants that filter by the foreign key column to avoid joining the users table
     * which can trigger loading of the User entity for each Order.
     */
    @Query(value = "SELECT * FROM orders o WHERE o.user_id = :userId ORDER BY o.created_at DESC",
        countQuery = "SELECT count(*) FROM orders o WHERE o.user_id = :userId",
        nativeQuery = true)
    Page<Order> findOrdersByUserIdNative(@Param("userId") Long userId, Pageable pageable);

    @Query(value = "SELECT * FROM orders o WHERE o.user_id = :userId ORDER BY o.created_at DESC LIMIT 1",
        nativeQuery = true)
    Optional<Order> findLatestOrderByUserIdNative(@Param("userId") Long userId);

    /**
     * Helper to check ownership without loading User entity
     */
    boolean existsByIdAndUser_Id(Long id, Long userId);
}
