package com.computershop.service.interfaces;

import com.computershop.dto.request.ProductRequest;
import com.computershop.dto.request.ProductWithImageUrlsRequest;
import com.computershop.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    
    /**
     * Lấy tất cả sản phẩm đang hoạt động
     */
    List<ProductResponse> getAllProducts();
    
    /**
     * Lấy tất cả sản phẩm với phân trang
     */
    Page<ProductResponse> getAllProducts(Pageable pageable);
    
    /**
     * Lấy chi tiết sản phẩm theo ID
     */
    ProductResponse getProductById(Long id);

    /**
     * Lấy sản phẩm theo danh mục với phân trang
     */
    Page<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable);
    
    /**
     * Tìm kiếm sản phẩm
     */
    Page<ProductResponse> searchProducts(String keyword, Pageable pageable);
    
    /**
     * Tìm kiếm sản phẩm với bộ lọc
     */
    Page<ProductResponse> searchProductsWithFilters(Long categoryId, String keyword, 
                                                   BigDecimal minPrice, BigDecimal maxPrice, 
                                                   Pageable pageable);
    
    /**
     * Lấy sản phẩm với filters tổng hợp (OPTIMIZED - sử dụng cho API filtering)
     * @param categoryIds - Danh sách category IDs
     * @param minPrice - Giá tối thiểu
     * @param maxPrice - Giá tối đa
     * @param inStock - Chỉ lấy sản phẩm còn hàng
     * @param search - Từ khóa tìm kiếm
     * @param sortBy - Trường sắp xếp (id, name, price, createdAt)
     * @param sortDirection - Hướng sắp xếp (asc, desc)
     * @param pageable - Phân trang
     */
    Page<ProductResponse> getProductsWithFilters(
            List<Long> categoryIds,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean inStock,
            String search,
            String sortBy,
            String sortDirection,
            Pageable pageable
    );
    

    /**
     * Tạo sản phẩm mới
     */
    ProductResponse createProduct(ProductRequest request);

    /**
     * Tạo sản phẩm mới bằng cách truyền image URLs (không upload file)
     */
    ProductResponse createProductWithImageUrls(ProductWithImageUrlsRequest request);
    
    /**
     * Create product with uploaded image files. Files are stored and ProductImage rows are persisted.
     */
    ProductResponse createProduct(ProductRequest request, MultipartFile[] images) throws java.io.IOException;
    
    /**
     * Cập nhật sản phẩm
     */
    ProductResponse updateProduct(Long id, ProductRequest request);

    
    /**
     * Xóa sản phẩm (soft delete)
     */
    void deleteProduct(Long id);
    
    /**
     * Cập nhật tồn kho
     */
    void updateStock(Long productId, Integer newQuantity, String reason, Long performedBy);

    /**
     * Đếm tổng số sản phẩm active (dành cho paging)
     */
    long countProducts();
}
