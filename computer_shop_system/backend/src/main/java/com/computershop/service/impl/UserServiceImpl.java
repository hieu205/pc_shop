package com.computershop.service.impl;

import com.computershop.dto.request.LoginRequest;
import com.computershop.dto.request.ProfileUpdateRequest;
import com.computershop.dto.request.RegisterRequest;
import com.computershop.dto.request.UserRequest;
import com.computershop.dto.response.AuthResponse;
import com.computershop.dto.response.UserResponse;
import com.computershop.entity.Role;
import com.computershop.entity.User;
import com.computershop.repository.RoleRepository;
import com.computershop.repository.UserRepository;
import com.computershop.service.interfaces.TokenService;
import com.computershop.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    
    @Override
    public UserResponse createUser(UserRequest request) {
        // Kiểm tra username đã tồn tại
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }
        
        // Kiểm tra email đã tồn tại
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }
        
        // Kiểm tra phone đã tồn tại (nếu có)
        if (request.getPhone() != null && !request.getPhone().isEmpty() && userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone đã tồn tại");
        }
        
        // Convert role string to Role entity
    Role userRole = roleRepository.findByName("CUSTOMER")
        .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò mặc định CUSTOMER"));
        
        
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(userRole)
                .isActive(true)
                .build();
        
        User savedUser = userRepository.save(user);
        return UserResponse.fromEntity(savedUser);
    }
    
    @Override
    public UserResponse updateUser(Long id, UserRequest request) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + id));

        // Kiểm tra username đã tồn tại (nếu thay đổi)
        if (request.getUsername() != null && !user.getUsername().equals(request.getUsername()) &&
            userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }
        // Kiểm tra email đã tồn tại (nếu thay đổi)
        if (request.getEmail() != null && !user.getEmail().equals(request.getEmail()) && 
            userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }
        // Kiểm tra phone đã tồn tại (nếu thay đổi)
        if (request.getPhone() != null && !request.getPhone().equals(user.getPhone()) &&
            userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone đã tồn tại");
        }
        
        // Cập nhật email nếu có
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        
        // Cập nhật password nếu có
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        
        // Cập nhật fullName nếu có
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        
        // Cập nhật phone nếu có
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        
        // Cập nhật address nếu có
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        
        User updatedUser = userRepository.save(user);
        return UserResponse.fromEntity(updatedUser);
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + id));
        return UserResponse.fromEntity(user);
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với username: " + username));
        return UserResponse.fromEntity(user);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        Page<User> users = userRepository.findAll(pageable);
        return users.map(UserResponse::fromEntity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRole(String role) {
    Role roleEntity = roleRepository.findByName(role.toUpperCase())
        .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò: " + role));
        List<User> users = userRepository.findByRole(roleEntity);
        return users.stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Override
    public void deleteUser(Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + id));
        
        user.setIsActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserResponse authenticate(String username, String password) {
    // Resolve identifier to actual user (username/email/phone)
    User user = userRepository.findByUsername(username)
        .or(() -> userRepository.findByEmail(username))
        .or(() -> userRepository.findByPhone(username))
        .orElseThrow(() -> new RuntimeException("Tên đăng nhập hoặc mật khẩu không đúng"));
        
        if (!user.getIsActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Tên đăng nhập hoặc mật khẩu không đúng");
        }
        
        return UserResponse.fromEntity(user);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByPhone(String phone) {
        return userRepository.existsByPhone(phone);
    }
    
    @Override
    public AuthResponse login(LoginRequest request) {
    // Resolve identifier -> username (we'll authenticate using the resolved username)
    String identifier = request.getIdentifier();
    User user = userRepository.findByUsername(identifier)
        .or(() -> userRepository.findByEmail(identifier))
        .or(() -> userRepository.findByPhone(identifier))
        .orElseThrow(() -> new RuntimeException("User not found"));

    // Authenticate user using the found username
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            user.getUsername(),
            request.getPassword()
        )
    );
        
        if (!user.getIsActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa");
        }
        
        // Generate JWT token
        String accessToken = tokenService.generateToken(user);
        String refreshToken = tokenService.generateRefreshToken(user);
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(30L * 24 * 60 * 60) // 30 days in seconds
                .user(UserResponse.fromEntity(user))
                .build();
    }
    
    @Override
    public AuthResponse register(RegisterRequest request) {
        // Validate user doesn't exist
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }
        
        // Get default CUSTOMER role
        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new RuntimeException("Default role CUSTOMER not found"));
        
        // Create new user
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(customerRole)
                .isActive(true)
                .build();
        
        User savedUser = userRepository.save(user);
        
        // Generate JWT tokens
        String accessToken = tokenService.generateToken(savedUser);
        String refreshToken = tokenService.generateRefreshToken(savedUser);
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(30L * 24 * 60 * 60) // 30 days in seconds
                .user(UserResponse.fromEntity(savedUser))
                .build();
    }
    
    @Override
    public UserResponse getCurrentUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        return UserResponse.fromEntity(user);
    }
    
    @Override
    public UserResponse updateCurrentUserProfile(String username, ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        // Kiểm tra email đã tồn tại (trừ email hiện tại của user)
        if (!user.getEmail().equals(request.getEmail()) && 
            userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }
        
        // Cập nhật thông tin
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setUpdatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        return UserResponse.fromEntity(savedUser);
    }

    @Override
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!user.getIsActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa");
        }

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không đúng");
        }

        // Update to new password only
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
