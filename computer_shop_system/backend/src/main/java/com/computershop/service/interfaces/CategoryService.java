package com.computershop.service.interfaces;

import com.computershop.dto.request.CategoryRequest;
import com.computershop.dto.response.CategoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CategoryService {
    
    /**
     * Lấy tất cả danh mục đang hoạt động
     */
    List<CategoryResponse> getActiveCategories();
    
    /**
     * Lấy danh mục gốc (không có parent)
     */
    List<CategoryResponse> getRootCategories();
    
    /**
     * Lấy danh mục con của một danh mục
     */
    List<CategoryResponse> getSubCategories(Long parentCategoryId);
    
    /**
     * Lấy chi tiết danh mục theo ID
     */
    CategoryResponse getCategoryById(Long id);
    
    /**
     * Tạo danh mục mới
     */
    CategoryResponse createCategory(CategoryRequest request);
    
    /**
     * Cập nhật danh mục
     */
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    
    /**
     * Xóa danh mục (soft delete)
     */
    void deleteCategory(Long id);
    
    /**
     * Lấy tất cả danh mục với phân trang (cho admin)
     */
    Page<CategoryResponse> getAllCategories(Pageable pageable);
}
