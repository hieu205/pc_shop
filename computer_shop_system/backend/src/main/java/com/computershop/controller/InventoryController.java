package com.computershop.controller;

import com.computershop.dto.request.InventoryRequest;
import com.computershop.dto.response.*;
import com.computershop.service.interfaces.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller cho quản lý tồn kho.
 * Chỉ chứa các API cần thiết cho STAFF/ADMIN: điều chỉnh, xem lịch sử, báo cáo low-stock.
 */
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Slf4j
public class InventoryController {

    private final InventoryService inventoryService;


        /** Lấy sản phẩm sắp hết kho (dưới ngưỡng). Quyền: STAFF, ADMIN */
    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LowStockSummaryResponse>> getLowStockProducts(
            @RequestParam(defaultValue = "10") int threshold) {
        
        log.info("Lấy sản phẩm sắp hết kho với ngưỡng: {}", threshold);
        List<InventoryResponse> lowStockProducts = inventoryService.getLowStockProducts(threshold);
        List<InventoryResponse> outOfStockProducts = inventoryService.getOutOfStockProducts();
        List<InventoryResponse> needRestockProducts = inventoryService.getProductsNeedingRestock();
        
    LowStockSummaryResponse response = LowStockSummaryResponse.fromResponses(
        lowStockProducts, outOfStockProducts, needRestockProducts);
        
        return ResponseEntity.ok(ApiResponse.<LowStockSummaryResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách sản phẩm sắp hết hàng thành công")
                .data(response)
                .build());
    }

        /** Lấy sản phẩm đã hết hàng. Quyền: STAFF, ADMIN */
    @GetMapping("/out-of-stock")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getOutOfStockProducts() {
        
    log.info("Lấy sản phẩm đã hết hàng");
    List<InventoryResponse> response = inventoryService.getOutOfStockProducts();
        
        return ResponseEntity.ok(ApiResponse.<List<InventoryResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách sản phẩm hết hàng thành công")
                .data(response)
                .build());
    }

        /** Lấy sản phẩm cần nhập lại kho. Quyền: STAFF, ADMIN */
    @GetMapping("/need-restock")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getProductsNeedingRestock() {
        
    log.info("Lấy sản phẩm cần nhập lại kho");
    List<InventoryResponse> response = inventoryService.getProductsNeedingRestock();
        
        return ResponseEntity.ok(ApiResponse.<List<InventoryResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách sản phẩm cần nhập hàng thành công")
                .data(response)
                .build());
    }

        /** Điều chỉnh tồn kho cho một sản phẩm. Quyền: ADMIN */
    @PostMapping("/products/{productId}/adjust")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventoryResponse>> adjustInventory(
            @PathVariable Long productId,
            @Valid @RequestBody InventoryRequest request) {
        
        log.info("Điều chỉnh tồn kho cho sản phẩm {} với yêu cầu: {}", productId, request);
        InventoryResponse response = inventoryService.adjustInventory(productId, request);
        
        return ResponseEntity.ok(ApiResponse.<InventoryResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Điều chỉnh tồn kho thành công")
                .data(response)
                .build());
    }

        /** Cập nhật ngưỡng cảnh báo tồn kho cho sản phẩm. Quyền: ADMIN */
    @PutMapping("/products/{productId}/threshold")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ThresholdUpdateResponse>> updateLowStockThreshold(
            @PathVariable Long productId,
            @RequestParam int threshold) {
        
        log.info("Cập nhật ngưỡng cảnh báo cho sản phẩm {} thành {}", productId, threshold);
        inventoryService.updateLowStockThreshold(productId, threshold);
        
        ThresholdUpdateResponse response = ThresholdUpdateResponse.create(productId, threshold);
        
        return ResponseEntity.ok(ApiResponse.<ThresholdUpdateResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Cập nhật ngưỡng cảnh báo thành công")
                .data(response)
                .build());
    }



                /** Lấy lịch sử thay đổi kho cho một sản phẩm (InventoryLog -> DTO). Quyền: ADMIN */
        @GetMapping("/products/{productId}/logs")
    @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<Page<InventoryLogResponse>>> getInventoryHistory(
            @PathVariable Long productId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        log.info("Lấy lịch sử kho cho sản phẩm {} với phân trang: {}", productId, pageable);
        // Service already returns DTO page; forward directly
        Page<InventoryLogResponse> historyPage = inventoryService.getInventoryHistory(productId, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<InventoryLogResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy lịch sử thay đổi kho thành công")
                .data(historyPage)
                .build());
    }

                /** Lấy toàn bộ lịch sử thay đổi kho theo phân trang (InventoryLog -> DTO). Quyền: ADMIN */
        @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<InventoryLogResponse>>> getAllInventoryHistory(
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("Lấy toàn bộ lịch sử tồn kho với phân trang: {}", pageable);
        // Service already returns DTO page; forward directly
        Page<InventoryLogResponse> historyPage = inventoryService.getAllInventoryHistory(pageable);

        return ResponseEntity.ok(ApiResponse.<Page<InventoryLogResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy toàn bộ lịch sử tồn kho thành công")
                .data(historyPage)
                .build());
    }




}
