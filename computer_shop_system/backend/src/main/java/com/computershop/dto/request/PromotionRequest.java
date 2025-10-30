package com.computershop.dto.request;

import com.computershop.entity.Promotion;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Request DTO for promotion creation and updates
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PromotionRequest {
    
    @NotBlank(message = "Promotion name is required")
    @Size(max = 200, message = "Promotion name must not exceed 200 characters")
    private String name;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    @NotNull(message = "Discount type is required")
    @JsonProperty("discount_type")
    private Promotion.DiscountType discountType;
    
    @JsonProperty("discount_value")
    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Discount value must be positive")
    private BigDecimal discountValue;
    
    @JsonProperty("minimum_order_amount")
    @DecimalMin(value = "0.0", message = "Minimum order amount must be non-negative")
    private BigDecimal minimumOrderAmount;
    
    @JsonProperty("start_date")
    @NotNull(message = "Start date is required")
    private LocalDateTime startDate;
    
    @JsonProperty("end_date")
    @NotNull(message = "End date is required")
    private LocalDateTime endDate;
    
    private Boolean isActive = true;
    
    // Custom validation method
    public boolean isValidDateRange() {
        if (startDate != null && endDate != null) {
            return endDate.isAfter(startDate);
        }
        return false;
    }
    
    // Helper method for percentage validation
    public boolean isValidPercentage() {
        if (discountType == Promotion.DiscountType.PERCENTAGE) {
            return discountValue != null && 
                   discountValue.compareTo(BigDecimal.ZERO) > 0 && 
                   discountValue.compareTo(new BigDecimal("100")) <= 0;
        }
        return true;
    }
}
