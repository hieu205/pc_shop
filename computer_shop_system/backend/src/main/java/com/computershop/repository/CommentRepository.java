package com.computershop.repository;

import com.computershop.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    /**
     * Tìm tất cả comment gốc (parent = null) của một sản phẩm với phân trang
     */
    @Query("SELECT c FROM Comment c WHERE c.product.id = :productId AND c.parentComment IS NULL ORDER BY c.createdAt DESC")
    Page<Comment> findRootCommentsByProductId(@Param("productId") Long productId, Pageable pageable);
    
    /**
     * Tìm tất cả comment con của một comment cha
     */
    @Query("SELECT c FROM Comment c WHERE c.parentComment.id = :parentId ORDER BY c.createdAt ASC")
    List<Comment> findRepliesByParentId(@Param("parentId") Long parentId);
    
    /**
     * Đếm số lượng comment của một sản phẩm
     */
    long countByProductId(Long productId);
    
    /**
     * Đếm số lượng comment con của một comment cha
     */
    long countByParentCommentId(Long parentId);
    
    /**
     * Tìm tất cả comment của một user
     */
    @Query("SELECT c FROM Comment c WHERE c.user.id = :userId ORDER BY c.createdAt DESC")
    Page<Comment> findCommentsByUserId(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * Tìm tất cả comment của một sản phẩm (bao gồm cả comment con)
     */
    @Query("SELECT c FROM Comment c WHERE c.product.id = :productId ORDER BY c.createdAt DESC")
    List<Comment> findAllCommentsByProductId(@Param("productId") Long productId);
    
    /**
     * Kiểm tra user có comment nào cho sản phẩm này không
     */
    boolean existsByUserIdAndProductId(Long userId, Long productId);

    /**
     * Kiểm tra comment thuộc về user
     */
    boolean existsByIdAndUserId(Long id, Long userId);
}
