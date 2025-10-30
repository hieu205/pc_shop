package com.computershop.service.interfaces;

import com.computershop.dto.request.LoginRequest;
import com.computershop.dto.request.ProfileUpdateRequest;
import com.computershop.dto.request.RegisterRequest;
import com.computershop.dto.request.UserRequest;
import com.computershop.dto.response.AuthResponse;
import com.computershop.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
    
    /**
     * Tạo người dùng mới
     */
    UserResponse createUser(UserRequest request);
    
    /**
     * Cập nhật thông tin người dùng
     */
    UserResponse updateUser(Long id, UserRequest request);
    
    /**
     * Lấy thông tin người dùng theo ID
     */
    UserResponse getUserById(Long id);
    
    /**
     * Lấy thông tin người dùng theo username
     */
    UserResponse getUserByUsername(String username);
    
    /**
     * Lấy tất cả người dùng với phân trang
     */
    Page<UserResponse> getAllUsers(Pageable pageable);
    
    /**
     * Lấy người dùng theo role
     */
    List<UserResponse> getUsersByRole(String role);
    
    /**
     * Xóa người dùng (soft delete)
     */
    void deleteUser(Long id);
    
    /**
     * Lấy thông tin profile của user hiện tại
     */
    UserResponse getCurrentUserProfile(String username);
    
    /**
     * Cập nhật thông tin profile của user hiện tại
     */
    UserResponse updateCurrentUserProfile(String username, ProfileUpdateRequest request);
    
    /**
     * Kiểm tra đăng nhập
     */
    UserResponse authenticate(String username, String password);
    
    /**
     * Kiểm tra username đã tồn tại
     */
    boolean existsByUsername(String username);
    
    /**
     * Kiểm tra email đã tồn tại
     */
    boolean existsByEmail(String email);
    
    /**
     * Kiểm tra phone đã tồn tại
     */
    boolean existsByPhone(String phone);
    
    /**
     * Đăng nhập người dùng
     */
    AuthResponse login(LoginRequest request);
    
    /**
     * Đăng ký người dùng mới
     */
    AuthResponse register(RegisterRequest request);

    /**
     * Thay đổi mật khẩu cho user hiện tại (xác thực bằng JWT)
     */
    void changePassword(Long userId, String oldPassword, String newPassword);
}
