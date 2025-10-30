package com.computershop.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for threshold update response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThresholdUpdateResponse {
    
    @JsonProperty("product_id")
    private Long productId;

    @JsonProperty("new_threshold")
    private Integer newThreshold;

    @JsonProperty("message")
    private String message;
    
    public static ThresholdUpdateResponse create(Long productId, Integer threshold) {
        return ThresholdUpdateResponse.builder()
                .productId(productId)
                .newThreshold(threshold)
                .message("Cập nhật ngưỡng cảnh báo thành công")
                .build();
    }
}
