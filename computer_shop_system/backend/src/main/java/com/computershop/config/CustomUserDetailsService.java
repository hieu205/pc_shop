package com.computershop.config;

import com.computershop.entity.User;
import com.computershop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;

/**
 * Triển khai (implementation) tùy chỉnh của UserDetailsService cho Spring Security
 * Dùng để tải thông tin người dùng từ cơ sở dữ liệu và tạo đối tượng UserDetails
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Đang tải thông tin người dùng theo identifier: {}", username);

        // Try username -> email -> phone
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .or(() -> userRepository.findByPhone(username))
                .orElseThrow(() -> {
                    log.warn("Không tìm thấy người dùng với identifier: {}", username);
                    return new UsernameNotFoundException("Không tìm thấy người dùng với identifier: " + username);
                });

        if (!user.getIsActive()) {
            log.warn("Tài khoản người dùng đã bị vô hiệu hóa: {}", username);
            throw new UsernameNotFoundException("Tài khoản người dùng đã bị vô hiệu hóa: " + username);
        }

        log.debug("Tải thông tin người dùng thành công: {} với vai trò (role): {}", username, user.getRole().getName());

        return new CustomUserPrincipal(user);
    }

    /**
     * Lớp UserDetails tùy chỉnh
     * Dùng để ánh xạ thông tin người dùng trong hệ thống vào đối tượng bảo mật của Spring Security
     */
    public static class CustomUserPrincipal implements UserDetails {

        private final User user;

        public CustomUserPrincipal(User user) {
            this.user = user;
        }

        public User getUser() {
            return user;
        }

        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
            // Chuyển đổi role của người dùng thành quyền (authority) của Spring Security
            String roleName = "ROLE_" + user.getRole().getName();
            return Collections.singletonList(new SimpleGrantedAuthority(roleName));
        }

        @Override
        public String getPassword() {
            return user.getPassword();
        }

        @Override
        public String getUsername() {
            return user.getUsername();
        }

        @Override
        public boolean isAccountNonExpired() {
            return true; // Hệ thống hiện không có logic hết hạn tài khoản
        }

        @Override
        public boolean isAccountNonLocked() {
            return true; // Hệ thống hiện không có logic khóa tài khoản
        }

        @Override
        public boolean isCredentialsNonExpired() {
            return true; // Hệ thống hiện không có logic hết hạn thông tin đăng nhập
        }

        @Override
        public boolean isEnabled() {
            return user.getIsActive();
        }

        // Các phương thức bổ sung
        public Long getUserId() {
            return user.getId();
        }

        public String getFullName() {
            return user.getFullName();
        }

        public String getEmail() {
            return user.getEmail();
        }

        public String getRoleName() {
            return user.getRole().getName();
        }
    }
}
