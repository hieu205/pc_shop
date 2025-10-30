package com.computershop.dto.response;

import com.computershop.entity.Order;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    
    private Long id;
    
    @JsonProperty("user_id")
    private Long userId;
    
    @JsonProperty("user_name")
    private String userName;

    @JsonProperty("order_code")
    private String orderCode;
    
    @JsonProperty("total_amount")
    private BigDecimal totalAmount;
    
    @JsonProperty("discount_amount")
    private BigDecimal discountAmount;

    @JsonProperty("final_amount")
    private BigDecimal finalAmount;

    @JsonProperty("customer_name")
    private String customerName;

    @JsonProperty("customer_email")
    private String customerEmail;

    @JsonProperty("shipping_phone")
    private String shippingPhone;
    
    @JsonProperty("promotion_id")
    private Long promotionId;

    @JsonProperty("promotion_name")
    private String promotionName;
    
    private String status;
    
    @JsonProperty("shipping_address")
    private String shippingAddress;
    
    private String notes;
    
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
    
    @JsonProperty("order_items")
    private List<OrderItemResponse> orderItems;
    
    public static OrderResponse fromEntity(Order order) {
        if (order == null) {
            return null;
        }
        
        OrderResponseBuilder builder = OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .customerName(order.getCustomerName())
                .customerEmail(order.getCustomerEmail())
                .shippingPhone(order.getShippingPhone())
                .status(order.getStatus().toString())
                .shippingAddress(order.getShippingAddress())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt());
        
        // Lấy order items nếu có
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            List<OrderItemResponse> orderItemResponses = order.getOrderItems()
                    .stream()
                    .map(OrderItemResponse::fromEntity)
                    .collect(Collectors.toList());
            builder.orderItems(orderItemResponses);
        }
        // map promotion if present
        if (order.getPromotion() != null) {
            builder.promotionId(order.getPromotion().getId());
            builder.promotionName(order.getPromotion().getName());
        }
        
        return builder.build();
    }
    
    public static OrderResponse fromEntityWithoutItems(Order order) {
        if (order == null) {
            return null;
        }
        
        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().toString())
                .shippingAddress(order.getShippingAddress())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .promotionId(order.getPromotion() != null ? order.getPromotion().getId() : null)
                .promotionName(order.getPromotion() != null ? order.getPromotion().getName() : null)
                .build();
    }
}
