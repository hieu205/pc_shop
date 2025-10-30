package com.computershop.service.interfaces;

import com.computershop.dto.request.CartItemRequest;
import com.computershop.dto.request.GuestCartMergeRequest;
import com.computershop.dto.response.CartResponse;

public interface CartService {
    
    /**
     * Lấy giỏ hàng của user
     */
    CartResponse getCartByUserId(Long userId);
    
    /**
     * Thêm sản phẩm vào giỏ hàng
     */
    CartResponse addItemToCart(Long userId, CartItemRequest request);
    
    /**
     * Cập nhật số lượng sản phẩm trong giỏ hàng
     */
    CartResponse updateCartItem(Long userId, Long cartItemId, Integer quantity);
    
    /**
     * Xóa sản phẩm khỏi giỏ hàng
     */
    CartResponse removeItemFromCart(Long userId, Long cartItemId);
    
    /**
     * Xóa toàn bộ giỏ hàng
     */
    void clearCart(Long userId);
    
    /**
     * Merge guest cart với user cart khi login
     * Strategy: Same product → Add quantities, Different products → Add new
     */
    CartResponse mergeGuestCart(Long userId, GuestCartMergeRequest request);
}