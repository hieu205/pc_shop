package com.computershop.service.interfaces;

import com.computershop.dto.request.InventoryRequest;
import com.computershop.dto.response.InventoryResponse;
import com.computershop.dto.response.InventoryLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Interface service cho quản lý tồn kho.
 * Chứa các phương thức điều chỉnh, kiểm tra tồn, và lấy lịch sử (InventoryLog -> DTO).
 */
public interface InventoryService {
    
    /**
     * Điều chỉnh tồn kho cho sản phẩm.
     * @param productId ID sản phẩm
     * @param request Chi tiết yêu cầu điều chỉnh (InventoryRequest)
     * @return Thông tin inventory sau điều chỉnh (InventoryResponse)
     */
    InventoryResponse adjustInventory(Long productId, InventoryRequest request);

    /** Lấy danh sách sản phẩm có tồn dưới ngưỡng (DTO) */
    List<com.computershop.dto.response.InventoryResponse> getLowStockProducts(int threshold);
    
    /** Lấy danh sách sản phẩm đã hết hàng (DTO) */
    List<com.computershop.dto.response.InventoryResponse> getOutOfStockProducts();
    
    /** Lấy lịch sử thay đổi tồn kho cho sản phẩm (trả về Page<InventoryLogResponse>) */
    Page<InventoryLogResponse> getInventoryHistory(Long productId, Pageable pageable);
    
    /** Lấy toàn bộ lịch sử thay đổi tồn kho theo phân trang (trả về Page<InventoryLogResponse>) */
    Page<InventoryLogResponse> getAllInventoryHistory(Pageable pageable);

    /** Kiểm tra tồn kho có đủ cho số lượng yêu cầu hay không */
    boolean isStockAvailable(Long productId, int quantity);
    
    /** Cập nhật ngưỡng low-stock cho sản phẩm */
    void updateLowStockThreshold(Long productId, int threshold);
    
    /** Lấy danh sách sản phẩm cần nhập hàng (low stock) trả về DTO */
    List<com.computershop.dto.response.InventoryResponse> getProductsNeedingRestock();
}
