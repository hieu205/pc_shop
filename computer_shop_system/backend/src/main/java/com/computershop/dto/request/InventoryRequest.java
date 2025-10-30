package com.computershop.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu (Request) cho các thao tác điều chỉnh tồn kho
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryRequest {
    
    @NotBlank(message = "Bắt buộc phải có loại thao tác")
    @JsonProperty("operation_type")
    private String operationType; // "RESTOCK", "SALE", "DAMAGE", "ADJUSTMENT_IN", "ADJUSTMENT_OUT", "RETURN"
    
    @NotNull(message = "Bắt buộc phải có số lượng")
    @Min(value = 1, message = "Số lượng phải là số dương")
    private Integer quantity;
    
    @NotBlank(message = "Bắt buộc phải có lý do")
    private String reason;
    
    // Trường tùy chọn cho một số thao tác cụ thể
    @JsonProperty("order_id")
    private Long orderId;        // Dùng cho các thay đổi liên quan đến đơn hàng
    @JsonProperty("supplier_info")
    private String supplierInfo; // Dùng cho thao tác nhập hàng (restock)
    private String notes;        // Ghi chú bổ sung
    
    // Dùng để cập nhật ngưỡng cảnh báo tồn kho thấp
    @JsonProperty("low_stock_threshold")
    private Integer lowStockThreshold;
    
    // Hàm hỗ trợ: xác định thao tác làm tăng tồn kho
    public boolean isStockIncrease() {
        return "RESTOCK".equals(operationType) || 
               "RETURN".equals(operationType) || 
               "ADJUSTMENT_IN".equals(operationType);
    }
    
    // Hàm hỗ trợ: xác định thao tác làm giảm tồn kho
    public boolean isStockDecrease() {
        return "SALE".equals(operationType) || 
               "DAMAGE".equals(operationType) || 
               "ADJUSTMENT_OUT".equals(operationType);
    }
}
