package com.computershop.repository;

import com.computershop.entity.Token;
import com.computershop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TokenRepository extends JpaRepository<Token, Long> {
    
    /**
     * Tìm token theo token string
     */
    Optional<Token> findByToken(String token);
    
    /**
     * Tìm tất cả token hợp lệ của user
     */
    @Query("SELECT t FROM Token t WHERE t.user = :user AND t.expired = false AND t.revoked = false")
    List<Token> findAllValidTokensByUser(@Param("user") User user);
    
    /**
     * Tìm tất cả token của user
     */
    @Query("SELECT t FROM Token t WHERE t.user = :user")
    List<Token> findAllTokensByUser(@Param("user") User user);
    
    /**
     * Revoke tất cả token của user
     */
    @Modifying
    @Query("UPDATE Token t SET t.revoked = true WHERE t.user = :user AND t.revoked = false")
    void revokeAllUserTokens(@Param("user") User user);
    
    /**
     * Xóa token đã expired
     */
    @Modifying
    @Query("DELETE FROM Token t WHERE t.expirationDate < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);
    
    /**
     * Kiểm tra token có tồn tại và hợp lệ không
     */
    @Query("SELECT t FROM Token t WHERE t.token = :token AND t.expired = false AND t.revoked = false AND t.expirationDate > :now")
    Optional<Token> findValidToken(@Param("token") String token, @Param("now") LocalDateTime now);
    
    /**
     * Đếm số token hợp lệ của user
     */
    @Query("SELECT COUNT(t) FROM Token t WHERE t.user = :user AND t.expired = false AND t.revoked = false")
    long countValidTokensByUser(@Param("user") User user);
}
