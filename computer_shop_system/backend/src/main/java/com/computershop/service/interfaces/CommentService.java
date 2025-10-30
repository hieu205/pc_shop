package com.computershop.service.interfaces;

import com.computershop.dto.request.CommentRequest;
import com.computershop.dto.response.CommentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CommentService {
    
    /**
     * Lấy bình luận theo sản phẩm với phân trang
     */
    Page<CommentResponse> getCommentsByProduct(Long productId, Pageable pageable);
    
    /**
     * Lấy tất cả bình luận gốc của sản phẩm (không bao gồm replies)
     */
    List<CommentResponse> getRootCommentsByProduct(Long productId);
    
    /**
     * Lấy chi tiết bình luận theo ID
     */
    CommentResponse getCommentById(Long id);
    
    /**
     * Tạo bình luận mới
     */
    CommentResponse createComment(Long productId, Long userId, CommentRequest request);
    
    /**
     * Reply bình luận (dành cho staff hoặc user)
     */
    CommentResponse replyComment(Long parentCommentId, Long userId, CommentRequest request);
    
    /**
     * Cập nhật bình luận
     */
    CommentResponse updateComment(Long id, CommentRequest request);
    
    /**
     * Xóa bình luận
     */
    void deleteComment(Long id);

    /**
     * Kiểm tra comment có thuộc về user hay không
     */
    boolean isCommentOwner(Long commentId, Long userId);
    
    /**
     * Lấy bình luận theo user
     */
    Page<CommentResponse> getCommentsByUser(Long userId, Pageable pageable);
    
    /**
     * Lấy tất cả replies của một comment
     */
    List<CommentResponse> getRepliesByComment(Long commentId);
}
