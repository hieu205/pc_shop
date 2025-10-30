package com.computershop.repository;

import com.computershop.entity.Promotion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    
    /**
     * Tìm tất cả promotion đang hoạt động
     */
    @Query("SELECT p FROM Promotion p WHERE p.isActive = true AND p.startDate <= :now AND p.endDate >= :now")
    List<Promotion> findActivePromotions(@Param("now") LocalDateTime now);
    
    /**
     * Tìm promotion theo tên
     */
    List<Promotion> findByNameContainingIgnoreCase(String name);
    
    /**
     * Tìm promotion theo discount type
     */
    List<Promotion> findByDiscountType(Promotion.DiscountType discountType);
    
    /**
     * Tìm promotion theo discount type với pagination
     */
    Page<Promotion> findByDiscountType(Promotion.DiscountType discountType, Pageable pageable);
    
    /**
     * Tìm promotion có minimum order amount nhỏ hơn hoặc bằng amount
     */
    @Query("SELECT p FROM Promotion p WHERE p.isActive = true AND p.startDate <= :now AND p.endDate >= :now AND p.minimumOrderAmount <= :amount")
    List<Promotion> findApplicablePromotions(@Param("now") LocalDateTime now, @Param("amount") Double amount);
    
    /**
     * Kiểm tra promotion có đang hoạt động không
     */
    @Query("SELECT COUNT(p) > 0 FROM Promotion p WHERE p.id = :id AND p.isActive = true AND p.startDate <= :now AND p.endDate >= :now")
    boolean isPromotionActive(@Param("id") Long id, @Param("now") LocalDateTime now);
    
    /**
     * Tìm promotion sắp hết hạn (trong 7 ngày tới)
     */
    @Query("SELECT p FROM Promotion p WHERE p.isActive = true AND p.endDate BETWEEN :now AND :endDate")
    List<Promotion> findPromotionsEndingSoon(@Param("now") LocalDateTime now, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Kiểm tra tồn tại promotion với tên và active
     */
    boolean existsByNameAndIsActiveTrue(String name);
}
