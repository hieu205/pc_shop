package com.computershop.service.impl;

import com.computershop.dto.request.InventoryRequest;
import com.computershop.dto.response.InventoryLogResponse;
import com.computershop.dto.response.InventoryResponse;
import com.computershop.entity.InventoryLog;
import com.computershop.entity.Product;
import com.computershop.entity.User;
import com.computershop.exception.ResourceNotFoundException;
import com.computershop.repository.InventoryLogRepository;
import com.computershop.repository.ProductRepository;
import com.computershop.repository.UserRepository;
import com.computershop.service.interfaces.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Triển khai InventoryService cho quản lý tồn kho.
 * Bao gồm điều chỉnh, lấy báo cáo low-stock và lịch sử (InventoryLog -> DTO).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private final ProductRepository productRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final UserRepository userRepository;


    @Override
    public InventoryResponse adjustInventory(Long productId, InventoryRequest request) {
        log.info("Điều chỉnh tồn kho cho sản phẩm {} với thao tác: {}", productId, request.getOperationType());

        Product product = findProductById(productId);
        User currentUser = getCurrentUser();

        int oldQuantity = product.getQuantity();
        int newQuantity;
        InventoryLog.ChangeType changeType;

        if (request.isStockIncrease()) {
            newQuantity = oldQuantity + request.getQuantity();
            changeType = InventoryLog.ChangeType.IN;
        } else if (request.isStockDecrease()) {
            newQuantity = oldQuantity - request.getQuantity();
            changeType = InventoryLog.ChangeType.OUT;
            if (newQuantity < 0) {
                throw new IllegalArgumentException("Số lượng trong kho không đủ để điều chỉnh. Có: " + oldQuantity + ", Yêu cầu: " + request.getQuantity());
            }
        } else {
            throw new IllegalArgumentException("Loại thao tác không hợp lệ: " + request.getOperationType());
        }

        // Update product stock
        product.setQuantity(newQuantity);
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);

        // Create inventory log entity and persist
        InventoryLog inventoryLog = InventoryLog.builder()
                .product(product)
                .changeType(changeType)
                .quantityChange(request.getQuantity())
                .reason(request.getReason())
                .performedBy(currentUser)
                .createdAt(LocalDateTime.now())
                .build();

        inventoryLogRepository.save(inventoryLog);

        log.info("Tồn kho đã được điều chỉnh cho sản phẩm ID: {} từ {} đến {}", productId, oldQuantity, newQuantity);

        return InventoryResponse.fromEntity(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryResponse> getLowStockProducts(int threshold) {
        List<Product> products = productRepository.findByQuantityLessThanEqual(threshold);
        return products.stream().map(InventoryResponse::fromEntity).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryResponse> getOutOfStockProducts() {
        List<Product> products = productRepository.findByQuantity(0);
        return products.stream().map(InventoryResponse::fromEntity).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryLogResponse> getInventoryHistory(Long productId, Pageable pageable) {
        Page<InventoryLog> page = inventoryLogRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable);
        var dtoList = page.getContent().stream().map(InventoryLogResponse::fromEntity).collect(Collectors.toList());
        return new PageImpl<>(dtoList, PageRequest.of(page.getNumber(), page.getSize(), page.getSort()), page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryLogResponse> getAllInventoryHistory(Pageable pageable) {
        Page<InventoryLog> page = inventoryLogRepository.findAllOrderByCreatedAtDesc(pageable);
        var dtoList = page.getContent().stream().map(InventoryLogResponse::fromEntity).collect(Collectors.toList());
        return new PageImpl<>(dtoList, PageRequest.of(page.getNumber(), page.getSize(), page.getSort()), page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isStockAvailable(Long productId, int quantity) {
        Product product = findProductById(productId);
        return product.getQuantity() >= quantity;
    }

    @Override
    public void updateLowStockThreshold(Long productId, int threshold) {
        log.info("Cập nhật ngưỡng tồn kho thấp cho sản phẩm ID: {} thành {}", productId, threshold);

        Product product = findProductById(productId);
        product.setLowStockThreshold(threshold);
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);

    InventoryLog inventoryLogEntity = InventoryLog.builder()
        .product(product)
        .changeType(InventoryLog.ChangeType.IN)
        .quantityChange(0)
        .reason("Low stock threshold updated to " + threshold)
        .performedBy(getCurrentUser())
        .createdAt(LocalDateTime.now())
        .build();

    inventoryLogRepository.save(inventoryLogEntity);
    // use lombok logger
    org.slf4j.LoggerFactory.getLogger(InventoryServiceImpl.class).info("Low stock threshold updated for product ID: {}", productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryResponse> getProductsNeedingRestock() {
        List<Product> products = productRepository.findLowStockProducts();
        return products.stream().map(InventoryResponse::fromEntity).collect(Collectors.toList());
    }

    private Product findProductById(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + id));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return userRepository.findById(1L).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng mặc định"));
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + username));
    }
}
