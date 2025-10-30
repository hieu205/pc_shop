package com.computershop.service.interfaces;

import com.computershop.entity.Token;
import com.computershop.entity.User;

import java.util.List;

public interface TokenService {
    
    /**
     * Tạo JWT token cho user
     */
    String generateToken(User user);
    
    /**
     * Tạo refresh token
     */
    String generateRefreshToken(User user);
    
    /**
     * Validate JWT token
     */
    boolean isTokenValid(String token, User user);
    
    /**
     * Extract username từ token
     */
    String extractUsername(String token);
    
    /**
     * Lưu token vào database
     */
    void saveUserToken(User user, String jwtToken);
    
    /**
     * Revoke tất cả token của user
     */
    void revokeAllUserTokens(User user);
    
    /**
     * Lấy tất cả token hợp lệ của user
     */
    List<Token> getValidUserTokens(User user);
    
    /**
     * Refresh token
     */
    String refreshToken(String refreshToken);
    
    /**
     * Logout - revoke token
     */
    void logout(String token);
    
    /**
     * Cleanup expired tokens
     */
    void cleanupExpiredTokens();
    
    /**
     * Kiểm tra token có expired không
     */
    boolean isTokenExpired(String token);
    
    /**
     * Kiểm tra token có bị revoke không
     */
    boolean isTokenRevoked(String token);
}
