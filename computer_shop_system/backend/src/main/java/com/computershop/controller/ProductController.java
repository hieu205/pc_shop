package com.computershop.controller;

import com.computershop.dto.request.ProductRequest;
import com.computershop.dto.request.ProductWithImageUrlsRequest;
import com.computershop.dto.response.ApiResponse;
import com.computershop.dto.response.ProductResponse;
import com.computershop.service.interfaces.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * Lấy tất cả sản phẩm với phân trang và filtering (OPTIMIZED)
     * Hỗ trợ filter theo: categoryIds, minPrice, maxPrice, inStock, search, sortBy
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @RequestParam(required = false) List<Long> categoryIds,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection,
            Pageable pageable
    ) {
        Page<ProductResponse> products = productService.getProductsWithFilters(
                categoryIds, minPrice, maxPrice, inStock, search, sortBy, sortDirection, pageable
        );
        return ResponseEntity.ok(ApiResponse.<Page<ProductResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách sản phẩm thành công")
                .data(products)
                .build());
    }

    /**
     * Lấy chi tiết sản phẩm theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.<ProductResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy thông tin sản phẩm thành công")
                .data(product)
                .build());
    }

    /**
     * Lấy sản phẩm theo danh mục
     */
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProductsByCategory(
            @PathVariable Long categoryId, Pageable pageable) {
        Page<ProductResponse> products = productService.getProductsByCategory(categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<ProductResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy sản phẩm theo danh mục thành công")
                .data(products)
                .build());
    }

    /**
     * Tìm kiếm sản phẩm
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> searchProducts(
            @RequestParam String keyword, Pageable pageable) {
        Page<ProductResponse> products = productService.searchProducts(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<ProductResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Tìm kiếm sản phẩm thành công")
                .data(products)
                .build());
    }

    /**
     * Lấy tổng số sản phẩm (không yêu cầu token, dùng cho paging trên frontend)
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getTotalProducts() {
        long total = productService.countProducts();
        return ResponseEntity.ok(ApiResponse.<Long>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy tổng số sản phẩm thành công")
                .data(total)
                .build());
    }

    /**
     * Tạo sản phẩm mới
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(consumes = {"application/json", "multipart/form-data"})
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @RequestPart(name = "product") @Valid ProductRequest request,
            @RequestPart(name = "images", required = false) MultipartFile[] images
    ) throws IOException {
        ProductResponse product = productService.createProduct(request, images);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ProductResponse>builder()
                        .statusCode(HttpStatus.CREATED.value())
                        .message("Tạo sản phẩm thành công")
                        .data(product)
                        .build());
    }

    /**
     * Tạo sản phẩm mới bằng cách truyền image URLs trong body JSON
     * Chỉ ADMIN được phép (yêu cầu role ADMIN)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(path = "/with-image-urls", consumes = "application/json")
    public ResponseEntity<ApiResponse<ProductResponse>> createProductWithImageUrls(
            @Valid @RequestBody ProductWithImageUrlsRequest request
    ) {
        ProductResponse product = productService.createProductWithImageUrls(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ProductResponse>builder()
                        .statusCode(HttpStatus.CREATED.value())
                        .message("Tạo sản phẩm thành công (image URLs)")
                        .data(product)
                        .build());
    }

    /**
     * Cập nhật sản phẩm
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.<ProductResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Cập nhật sản phẩm thành công")
                .data(product)
                .build());
    }

    /**
     * Xóa sản phẩm (soft delete)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Xóa sản phẩm thành công")
                .build());
    }


}
