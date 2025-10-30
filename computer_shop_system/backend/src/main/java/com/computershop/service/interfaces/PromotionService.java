package com.computershop.service.interfaces;

import com.computershop.dto.request.PromotionRequest;
import com.computershop.dto.response.PromotionResponse;
import com.computershop.entity.Promotion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service interface for promotion management operations
 * Handles discount calculations, promotion validation, and active promotions
 */
public interface PromotionService {
    
    /**
     * Create a new promotion
     * @param request Promotion creation details
     * @return Created promotion response
     */
    PromotionResponse createPromotion(PromotionRequest request);
    
    /**
     * Update an existing promotion
     * @param id Promotion ID
     * @param request Updated promotion details
     * @return Updated promotion response
     */
    PromotionResponse updatePromotion(Long id, PromotionRequest request);
    
    /**
     * Get promotion by ID
     * @param id Promotion ID
     * @return Promotion response
     */
    PromotionResponse getPromotionById(Long id);
    
    /**
     * Get all promotions with pagination
     * @param pageable Pagination information
     * @return Page of promotion responses
     */
    Page<PromotionResponse> getAllPromotions(Pageable pageable);
    
    /**
     * Get all active promotions
     * @return List of active promotions
     */
    List<PromotionResponse> getActivePromotions();
    
    /**
     * Get promotions applicable to a specific product price
     * @param productPrice Product price to check
     * @return List of applicable promotions
     */
    List<PromotionResponse> getApplicablePromotions(BigDecimal productPrice);
    
    /**
     * Delete a promotion (soft delete by setting active = false)
     * @param id Promotion ID to delete
     */
    void deletePromotion(Long id);
    
    /**
     * Activate a promotion
     * @param id Promotion ID to activate
     * @return Updated promotion response
     */
    PromotionResponse activatePromotion(Long id);
    
    /**
     * Deactivate a promotion
     * @param id Promotion ID to deactivate
     * @return Updated promotion response
     */
    PromotionResponse deactivatePromotion(Long id);
    
    /**
     * Calculate discount amount for a given price and promotion
     * @param originalPrice Original price
     * @param promotionId Promotion ID to apply
     * @return Discounted amount (how much to subtract)
     */
    BigDecimal calculateDiscount(BigDecimal originalPrice, Long promotionId);
    
    /**
     * Calculate final price after applying promotion
     * @param originalPrice Original price
     * @param promotionId Promotion ID to apply
     * @return Final price after discount
     */
    BigDecimal calculateFinalPrice(BigDecimal originalPrice, Long promotionId);
    
    /**
     * Check if a promotion is currently active and valid
     * @param promotionId Promotion ID to check
     * @return true if promotion is active and within date range
     */
    boolean isPromotionActive(Long promotionId);
    
    /**
     * Check if a promotion is applicable to a specific price
     * @param promotionId Promotion ID
     * @param price Price to check
     * @return true if promotion can be applied to this price
     */
    boolean isPromotionApplicable(Long promotionId, BigDecimal price);
    
    /**
     * Get the best promotion for a given price (highest discount)
     * @param price Price to check
     * @return Best applicable promotion, or null if none
     */
    PromotionResponse getBestPromotionForPrice(BigDecimal price);
    
    /**
     * Get promotions by discount type
     * @param discountType PERCENTAGE or FIXED_AMOUNT
     * @param pageable Pagination information
     * @return Page of promotions with specified discount type
     */
    Page<PromotionResponse> getPromotionsByDiscountType(Promotion.DiscountType discountType, Pageable pageable);
    
    /**
     * Validate promotion business rules
     * @param request Promotion request to validate
     * @throws IllegalArgumentException if validation fails
     */
    void validatePromotion(PromotionRequest request);
}
