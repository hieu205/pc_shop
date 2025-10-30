package com.computershop.service.impl;

import com.computershop.dto.request.CategoryRequest;
import com.computershop.dto.response.CategoryResponse;
import com.computershop.entity.Category;
import com.computershop.repository.CategoryRepository;
import com.computershop.service.interfaces.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@CacheConfig(cacheNames = "categories")
public class CategoryServiceImpl implements CategoryService {
    
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(key = "'active'")
    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findByIsActiveTrue()
                .stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(key = "'root'")
    public List<CategoryResponse> getRootCategories() {
        return categoryRepository.findActiveRootCategories()
                .stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(key = "'sub-' + #parentCategoryId")
    public List<CategoryResponse> getSubCategories(Long parentCategoryId) {
        return categoryRepository.findActiveSubCategories(parentCategoryId)
                .stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(key = "#id")
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: " + id));
        
        return CategoryResponse.fromEntity(category);
    }

    @Override
    @CacheEvict(allEntries = true)
    public CategoryResponse createCategory(CategoryRequest request) {
        // Validate parent category if provided
        Category parentCategory = null;
        if (request.getParentCategoryId() != null) {
            parentCategory = categoryRepository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục cha"));
            
            if (!parentCategory.getIsActive()) {
                throw new RuntimeException("Danh mục cha hiện không hoạt động");
            }
        }
        
        // Check if category name already exists
        if (categoryRepository.existsByName(request.getName())) {
            throw new RuntimeException("Tên danh mục đã tồn tại");
        }
        
        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .parentCategory(parentCategory)
                .isActive(true)
                .build();
        
        Category savedCategory = categoryRepository.save(category);
        return CategoryResponse.fromEntity(savedCategory);
    }

    @Override
    @CacheEvict(allEntries = true)
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
    Category category = categoryRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: " + id));

        // Validate and update parent category if changed
        Long currentParentId = category.getParentCategory() != null ? category.getParentCategory().getId() : null;
        Long requestParentId = request.getParentCategoryId();
        
        // Check if parent category is actually changing
        if (!Objects.equals(currentParentId, requestParentId)) {
            if (requestParentId != null) {
                // Setting new parent category
                Category parentCategory = categoryRepository.findById(requestParentId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục cha"));
                
                        if (!parentCategory.getIsActive()) {
                            throw new RuntimeException("Danh mục cha hiện không hoạt động");
                        }
                category.setParentCategory(parentCategory);
            } else {
                // Setting parent category to null (making it a root category)
                category.setParentCategory(null);
            }
        }

        // Check if new name already exists (except current category)
            if (!category.getName().equals(request.getName()) && 
            categoryRepository.existsByName(request.getName())) {
            throw new RuntimeException("Tên danh mục đã tồn tại");
        }

        // Update fields
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIsActive(true);


        Category updatedCategory = categoryRepository.save(category);
        return CategoryResponse.fromEntity(updatedCategory);
    }

    @Override
    @CacheEvict(allEntries = true)
    public void deleteCategory(Long id) {
    Category category = categoryRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: " + id));
        
        // Check if category has products
        if (!category.getProducts().isEmpty()) {
            throw new RuntimeException("Không thể xóa danh mục đang có sản phẩm");
        }
        
        // Check if category has subcategories
        if (!category.getSubCategories().isEmpty()) {
            throw new RuntimeException("Không thể xóa danh mục đang có danh mục con");
        }
        
        // Soft delete
        category.setIsActive(false);
        categoryRepository.save(category);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CategoryResponse> getAllCategories(Pageable pageable) {
        return categoryRepository.findAll(pageable)
                .map(CategoryResponse::fromEntity);
    }
}
