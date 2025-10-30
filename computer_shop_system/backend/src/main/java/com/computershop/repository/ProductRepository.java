package com.computershop.repository;

import com.computershop.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    /**
     * OPTIMIZED: Lấy tất cả products với JOIN FETCH category (giải quyết N+1 query)
     */
    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category WHERE p.isActive = true")
    List<Product> findByIsActiveTrue();
    
    /**
     * OPTIMIZED: Lấy products phân trang với JOIN FETCH category
     * Note: Page queries với JOIN FETCH cần 2 queries (count + data fetch) - đây là behavior bình thường của JPA
     */
    @Query(value = "SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category WHERE p.isActive = true",
           countQuery = "SELECT COUNT(DISTINCT p) FROM Product p WHERE p.isActive = true")
    Page<Product> findByIsActiveTrue(Pageable pageable);
    
       /**
        * Đếm tổng số sản phẩm đang active
        */
       long countByIsActiveTrue();
    
    /**
     * OPTIMIZED: Lấy products theo category với JOIN FETCH
     */
    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category c WHERE c.id = :categoryId AND p.isActive = true")
    List<Product> findByCategoryIdAndIsActiveTrue(@Param("categoryId") Long categoryId);
    
    /**
     * OPTIMIZED: Lấy products theo category phân trang với JOIN FETCH
     */
    @Query(value = "SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category c WHERE c.id = :categoryId AND p.isActive = true",
           countQuery = "SELECT COUNT(DISTINCT p) FROM Product p WHERE p.category.id = :categoryId AND p.isActive = true")
    Page<Product> findByCategoryIdAndIsActiveTrue(@Param("categoryId") Long categoryId, Pageable pageable);
    
    @Query("SELECT p FROM Product p JOIN p.category c WHERE p.isActive = true AND c.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> findByNameContainingIgnoreCaseAndIsActiveTrue(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.price BETWEEN :minPrice AND :maxPrice")
    Page<Product> findByPriceBetweenAndIsActiveTrue(@Param("minPrice") BigDecimal minPrice, 
                                                   @Param("maxPrice") BigDecimal maxPrice, 
                                                   Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.quantity <= p.lowStockThreshold AND p.isActive = true")
    List<Product> findLowStockProducts();
    
    @Query("SELECT p FROM Product p WHERE p.quantity = 0 AND p.isActive = true")
    List<Product> findOutOfStockProducts();
    
    // Additional inventory-related methods
    List<Product> findByQuantityLessThanEqual(Integer threshold);
    
    List<Product> findByQuantity(Integer quantity);
    
    @Query("SELECT p FROM Product p JOIN p.category c WHERE p.isActive = true AND c.isActive = true AND " +
           "(:categoryId IS NULL OR c.id = :categoryId) AND " +
           "(:keyword IS NULL OR " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice)")
    Page<Product> findProductsWithFilters(@Param("categoryId") Long categoryId,
                                         @Param("keyword") String keyword,
                                         @Param("minPrice") BigDecimal minPrice,
                                         @Param("maxPrice") BigDecimal maxPrice,
                                         Pageable pageable);
    
    /**
     * Tìm sản phẩm bán chạy nhất (dựa trên số lượng đã bán)
     */
    @Query("SELECT p FROM Product p " +
           "JOIN OrderItem oi ON oi.product.id = p.id " +
           "JOIN Order o ON o.id = oi.order.id " +
           "WHERE o.status = 'COMPLETED' AND p.isActive = true " +
           "GROUP BY p.id " +
           "ORDER BY SUM(oi.quantity) DESC")
    Page<Product> findTopSellingProducts(Pageable pageable);
    
    /**
     * Tìm sản phẩm bán chạy theo danh mục
     */
    @Query("SELECT p FROM Product p " +
           "JOIN OrderItem oi ON oi.product.id = p.id " +
           "JOIN Order o ON o.id = oi.order.id " +
           "WHERE o.status = 'COMPLETED' AND p.isActive = true AND p.category.id = :categoryId " +
           "GROUP BY p.id " +
           "ORDER BY SUM(oi.quantity) DESC")
    Page<Product> findTopSellingProductsByCategory(@Param("categoryId") Long categoryId, Pageable pageable);
    
    /**
     * Đếm tổng số lượng đã bán của một sản phẩm
     */
    @Query("SELECT COALESCE(SUM(oi.quantity), 0) FROM OrderItem oi " +
           "JOIN Order o ON o.id = oi.order.id " +
           "WHERE oi.product.id = :productId AND o.status = 'COMPLETED'")
    Long getTotalSoldQuantity(@Param("productId") Long productId);
    
    /**
     * Tìm sản phẩm tương tự (cùng danh mục, loại trừ sản phẩm hiện tại)
     */
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.id != :excludeProductId AND p.isActive = true")
    Page<Product> findSimilarProducts(@Param("categoryId") Long categoryId, 
                                     @Param("excludeProductId") Long excludeProductId, 
                                     Pageable pageable);
    
    /**
     * OPTIMIZED: Tìm sản phẩm với filters tổng hợp + LEFT JOIN FETCH (giải quyết N+1 query)
     * Hỗ trợ: categoryIds, minPrice, maxPrice, inStock, search, sortBy, sortDirection
     */
    @Query(value = "SELECT DISTINCT p FROM Product p " +
          "LEFT JOIN FETCH p.category c " +
          "WHERE p.isActive = true AND c.isActive = true " +
          "AND (:#{#categoryIds == null || #categoryIds.isEmpty()} = true OR c.id IN :categoryIds) " +
          "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
          "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
          "AND (:inStock IS NULL OR :inStock = false OR p.quantity > 0) " +
          "AND (:search IS NULL OR :search = '' OR " +
          "     LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
          "     LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
          "     LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))" ,
          countQuery = "SELECT COUNT(DISTINCT p) FROM Product p " +
                 "LEFT JOIN p.category c " +
                 "WHERE p.isActive = true AND c.isActive = true " +
                 "AND (:#{#categoryIds == null || #categoryIds.isEmpty()} = true OR c.id IN :categoryIds) " +
                 "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
                 "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
                 "AND (:inStock IS NULL OR :inStock = false OR p.quantity > 0) " +
                 "AND (:search IS NULL OR :search = '' OR " +
                 "     LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
                 "     LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
                 "     LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))" )
    Page<Product> findProductsWithAdvancedFilters(
           @Param("categoryIds") List<Long> categoryIds,
           @Param("minPrice") BigDecimal minPrice,
           @Param("maxPrice") BigDecimal maxPrice,
           @Param("inStock") Boolean inStock,
           @Param("search") String search,
           Pageable pageable
    );

       /**
        * Fetch a single product with its images eagerly loaded to avoid lazy loading issues
        */
       @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id = :id")
       java.util.Optional<Product> findByIdWithImages(@Param("id") Long id);
}
