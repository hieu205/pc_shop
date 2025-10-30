package com.computershop.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * CACHE CONFIGURATION
 * <p>
 * Sử dụng Caffeine (in-memory cache) để tối ưu performance:
 * - products: Cache danh sách và chi tiết sản phẩm (TTL: 10 phút)
 * - categories: Cache danh mục sản phẩm (TTL: 30 phút)
 * - promotions: Cache khuyến mãi (TTL: 5 phút)
 * - productSearch: Cache kết quả tìm kiếm (TTL: 5 phút)
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Configure Caffeine cache manager với multiple caches
     * Mỗi cache có TTL và size limit riêng
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                "products",           // Cache cho danh sách products (getAllProducts, getProductsByCategory)
                "productDetail",      // Cache cho chi tiết product (getProductById)
                "productSearch",      // Cache cho search results
                "categories",         // Cache cho categories
                "promotions",         // Cache cho promotions
                "activePromotions"    // Cache cho active promotions only
        );

        // Default cache configuration
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(1000)                      // Max 1000 entries per cache
                .expireAfterWrite(10, TimeUnit.MINUTES) // TTL 10 phút
                .recordStats());                        // Enable metrics cho monitoring

        return cacheManager;
    }

    /**
     * Cache configuration cho categories (TTL dài hơn vì ít thay đổi)
     */
    @Bean("categoriesCache")
    public Caffeine<Object, Object> categoriesCacheConfig() {
        return Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(30, TimeUnit.MINUTES)  // Categories ít thay đổi
                .recordStats();
    }

    /**
     * Cache configuration cho promotions (TTL ngắn hơn vì thay đổi thường xuyên)
     */
    @Bean("promotionsCache")
    public Caffeine<Object, Object> promotionsCacheConfig() {
        return Caffeine.newBuilder()
                .maximumSize(200)
                .expireAfterWrite(5, TimeUnit.MINUTES)   // Promotions cần fresh data
                .recordStats();
    }

    /**
     * Cache configuration cho search results (TTL ngắn, size lớn)
     */
    @Bean("searchCache")
    public Caffeine<Object, Object> searchCacheConfig() {
        return Caffeine.newBuilder()
                .maximumSize(2000)                       // Search queries nhiều
                .expireAfterWrite(5, TimeUnit.MINUTES)   // Search results cần update thường xuyên
                .recordStats();
    }
}
