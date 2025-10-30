package com.computershop.controller;

import com.computershop.dto.request.CategoryRequest;
import com.computershop.dto.response.ApiResponse;
import com.computershop.dto.response.CategoryResponse;
import com.computershop.service.interfaces.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {
    
    private final CategoryService categoryService;
    
    /**
     * Lấy tất cả danh mục đang hoạt động
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getActiveCategories() {
        List<CategoryResponse> categories = categoryService.getActiveCategories();
        return ResponseEntity.ok(ApiResponse.<List<CategoryResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách danh mục thành công")
                .data(categories)
                .build());
    }

    /**
     * Lấy chi tiết danh mục theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable Long id) {
        CategoryResponse category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.<CategoryResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy thông tin danh mục thành công")
                .data(category)
                .build());
    }

    /**
     * Lấy danh mục con theo parent ID
     */
    @GetMapping("/parent/{parentId}")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategoriesByParent(@PathVariable Long parentId) {
        List<CategoryResponse> categories = categoryService.getSubCategories(parentId);
        return ResponseEntity.ok(ApiResponse.<List<CategoryResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách danh mục con thành công")
                .data(categories)
                .build());
    }
    
    /**
     * Tạo danh mục mới
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<CategoryResponse>builder()
                        .statusCode(HttpStatus.CREATED.value())
                        .message("Tạo danh mục thành công")
                        .data(category)
                        .build());
    }
    
    /**
     * Cập nhật danh mục
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id, 
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.<CategoryResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Cập nhật danh mục thành công")
                .data(category)
                .build());
    }
    
    /**
     * Xóa danh mục (soft delete)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Xóa danh mục thành công")
                .build());
    }
}
