package com.computershop.service.impl;

import com.computershop.dto.request.ProductRequest;
import com.computershop.dto.request.ProductWithImageUrlsRequest;
import com.computershop.dto.response.ProductResponse;
import com.computershop.entity.Category;
import com.computershop.entity.InventoryLog;
import com.computershop.entity.Product;
import com.computershop.entity.User;
import com.computershop.repository.CategoryRepository;
import com.computershop.repository.InventoryLogRepository;
import com.computershop.repository.ProductRepository;
import com.computershop.repository.UserRepository;
import com.computershop.repository.ProductImageRepository;
import com.computershop.entity.ProductImage;
import com.computershop.service.interfaces.ProductService;
import com.computershop.service.interfaces.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
@CacheConfig(cacheNames = "products")
public class ProductServiceImpl implements ProductService {
    
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final UserRepository userRepository;
    private final ProductImageRepository productImageRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(key = "'all'")
    public List<ProductResponse> getAllProducts() {
        return productRepository.findByIsActiveTrue()
                .stream()
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(key = "'page-' + #pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort")
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findByIsActiveTrue(pageable)
                .map(ProductResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "productDetail", key = "#id")
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findByIdWithImages(id)
                .orElseGet(() -> productRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với id: " + id)));
        
        if (!product.getIsActive()) {
            throw new RuntimeException("Sản phẩm hiện không hoạt động");
        }
                // If images are still null, try to load explicitly (defensive)
                if (product.getImages() == null || product.getImages().isEmpty()) {
                        log.debug("Product id {} has no images loaded from findByIdWithImages; attempting explicit load", product.getId());
                        try {
                                java.util.List<ProductImage> imgs = productImageRepository.findByProductId(product.getId());
                                log.debug("productImageRepository.findByProductId({}) returned {} images", product.getId(), imgs == null ? 0 : imgs.size());
                                product.setImages(imgs);
                        } catch (Exception ex) {
                                // Log and continue - mapping will use fallback image if necessary
                                log.warn("Không thể tải hình ảnh sản phẩm cho id {}: {}", product.getId(), ex.getMessage());
                        }
                } else {
                        log.debug("Product id {} already has {} images loaded", product.getId(), product.getImages().size());
                }

        return ProductResponse.fromEntity(product);
    }



    @Override
    @Transactional(readOnly = true)
    @Cacheable(key = "'category-' + #categoryId + '-page-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable) {
                // Include products in the given category and all its descendant categories.
                java.util.List<Long> categoryIds = new java.util.ArrayList<>();
                collectCategoryAndChildren(categoryId, categoryIds);

                return productRepository.findProductsWithAdvancedFilters(
                                categoryIds,
                                null,
                                null,
                                null,
                                null,
                                pageable
                ).map(ProductResponse::fromEntity);
    }

        /**
         * Helper to collect a category id and all descendant category ids (DFS).
         */
        private void collectCategoryAndChildren(Long categoryId, java.util.List<Long> out) {
                if (categoryId == null) return;
                // Prevent duplicates
                if (out.contains(categoryId)) return;
                out.add(categoryId);
                // Find direct children and recurse
                java.util.List<com.computershop.entity.Category> children = categoryRepository.findByParentCategoryId(categoryId);
                if (children != null && !children.isEmpty()) {
                        for (com.computershop.entity.Category c : children) {
                                collectCategoryAndChildren(c.getId(), out);
                        }
                }
        }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "productSearch", key = "'search-' + #keyword + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<ProductResponse> searchProducts(String keyword, Pageable pageable) {
        return productRepository.findByNameContainingIgnoreCaseAndIsActiveTrue(keyword, pageable)
                .map(ProductResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "productSearch", key = "'filter-' + #categoryId + '-' + #keyword + '-' + #minPrice + '-' + #maxPrice + '-' + #pageable.pageNumber")
    public Page<ProductResponse> searchProductsWithFilters(Long categoryId, String keyword,
                                                          BigDecimal minPrice, BigDecimal maxPrice,
                                                          Pageable pageable) {
        return productRepository.findProductsWithFilters(categoryId, keyword, minPrice, maxPrice, pageable)
                .map(ProductResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "productSearch", 
               key = "'advanced-' + #categoryIds + '-' + #minPrice + '-' + #maxPrice + '-' + #inStock + '-' + #search + '-' + #sortBy + '-' + #sortDirection + '-' + #pageable.pageNumber")
    public Page<ProductResponse> getProductsWithFilters(
            List<Long> categoryIds,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean inStock,
            String search,
            String sortBy,
            String sortDirection,
            Pageable pageable
    ) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        return productRepository.findProductsWithAdvancedFilters(
                categoryIds, minPrice, maxPrice, inStock, search, sortedPageable
        ).map(ProductResponse::fromEntity);
    }


    @Override
    @CacheEvict(cacheNames = {"products", "productSearch"}, allEntries = true)
    public ProductResponse createProduct(ProductRequest request) {
        // Validate category exists and is active
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: " + request.getCategoryId()));
        
        if (!category.getIsActive()) {
            throw new RuntimeException("Danh mục hiện không hoạt động");
        }
        
        // Create product from request
        // Apply defaults to match DB schema if fields are null
        Integer qty = request.getQuantity() != null ? request.getQuantity() : 0;
        Integer lowStock = request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 10;

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .quantity(qty)
                .lowStockThreshold(lowStock)
                // imageUrl is stored in product_images table; keep transient here
                .category(category)
                .specifications(request.getSpecifications())
                .isActive(true)
                .build();
        
        Product savedProduct = productRepository.save(product);
        return ProductResponse.fromEntity(savedProduct);
    }

        @Override
        @CacheEvict(cacheNames = {"products", "productSearch"}, allEntries = true)
        public ProductResponse createProductWithImageUrls(ProductWithImageUrlsRequest request) {
                // Validate category exists and is active
                Category category = categoryRepository.findById(request.getCategoryId())
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: " + request.getCategoryId()));

                if (!category.getIsActive()) {
                        throw new RuntimeException("Danh mục hiện không hoạt động");
                }

                Integer qty = request.getQuantity() != null ? request.getQuantity() : 0;
                Integer lowStock = request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 10;

                Product product = Product.builder()
                                .name(request.getName())
                                .description(request.getDescription())
                                .price(request.getPrice())
                                .quantity(qty)
                                .lowStockThreshold(lowStock)
                                .category(category)
                                .specifications(request.getSpecifications())
                                .isActive(true)
                                .build();

                Product savedProduct = productRepository.save(product);

                // Persist provided image URLs as ProductImage entries
                if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
                        boolean primarySet = false;
                        for (String url : request.getImageUrls()) {
                                ProductImage img = ProductImage.builder()
                                                .product(savedProduct)
                                                .filePath(url)
                                                .isPrimary(false)
                                                .build();
                                if (!primarySet) {
                                        img.setIsPrimary(true);
                                        primarySet = true;
                                }
                                productImageRepository.save(img);
                        }
                        java.util.List<ProductImage> imgs = productImageRepository.findByProductId(savedProduct.getId());
                        savedProduct.setImages(imgs);
                }

                return ProductResponse.fromEntity(savedProduct);
        }

        @Override
        @CacheEvict(cacheNames = {"products", "productSearch"}, allEntries = true)
        public ProductResponse createProduct(ProductRequest request, org.springframework.web.multipart.MultipartFile[] images) throws java.io.IOException {
                // reuse existing create logic
                ProductResponse base = createProduct(request);
                Product product = productRepository.findById(base.getId()).orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm sau khi lưu"));

                // store files
                if (images != null && images.length > 0) {
                        java.util.List<String> stored = fileStorageService.storeAll(images);
                        boolean primarySet = false;
                        for (String path : stored) {
                                ProductImage img = ProductImage.builder()
                                                .product(product)
                                                .filePath(path)
                                                .isPrimary(false)
                                                .build();
                                if (!primarySet) {
                                        img.setIsPrimary(true);
                                        primarySet = true;
                                }
                                productImageRepository.save(img);
                        }
                                // Reload product images and attach to entity so DTO includes them
                                java.util.List<ProductImage> imgs = productImageRepository.findByProductId(product.getId());
                                product.setImages(imgs);
                }

                return ProductResponse.fromEntity(product);
        }

    @Override
    @CacheEvict(cacheNames = {"products", "productDetail", "productSearch"}, allEntries = true)
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với id: " + id));

        // Get category
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: " + request.getCategoryId()));

        // Update fields
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        product.setCategory(category);
        product.setSpecifications(request.getSpecifications());
        product.setLowStockThreshold(request.getLowStockThreshold());

        Product updatedProduct = productRepository.save(product);
        return ProductResponse.fromEntity(updatedProduct);
    }

    @Override
    @CacheEvict(cacheNames = {"products", "productDetail", "productSearch"}, allEntries = true)
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với id: " + id));
        
        // Soft delete by setting isActive to false
        product.setIsActive(false);
        productRepository.save(product);
    }

    @Override
    @CacheEvict(cacheNames = {"products", "productDetail"}, allEntries = true)
    public void updateStock(Long productId, Integer newQuantity, String reason, Long performedBy) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với id: " + productId));
        
        User user = userRepository.findById(performedBy)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + performedBy));

        Integer oldQuantity = product.getQuantity();
        Integer quantityChange = newQuantity - oldQuantity;
        InventoryLog.ChangeType changeType = quantityChange > 0 ? InventoryLog.ChangeType.IN : InventoryLog.ChangeType.OUT;

        // Update product quantity
        product.setQuantity(newQuantity);
        productRepository.save(product);

        // Log the inventory change
        InventoryLog log = new InventoryLog(
                product,
                changeType,
                Math.abs(quantityChange),
                reason,
                user
        );
        inventoryLogRepository.save(log);
    }

        @Override
        @Transactional(readOnly = true)
        public long countProducts() {
                return productRepository.countByIsActiveTrue();
        }
}
