package com.computershop.config;

import com.computershop.service.interfaces.TokenService;
import com.computershop.util.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Bộ lọc xác thực JWT
 * Kiểm tra và xác thực JWT cho mọi request, đồng thời thiết lập ngữ cảnh (context) xác thực người dùng.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final TokenService tokenService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        log.debug("Đang xử lý xác thực cho request: {}", request.getRequestURI());

        // Nếu request có header Authorization, hãy cố gắng parse token và set Authentication
        // Ngược lại, nếu endpoint public và không có header Authorization thì bỏ qua.
        final String authHeader = request.getHeader("Authorization");
        if ((authHeader == null || !authHeader.startsWith("Bearer ")) && isPublicEndpoint(request.getRequestURI(), request.getMethod())) {
            log.debug("Endpoint công khai không có Authorization header, bỏ qua: {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt;
        final String username;

        // Nếu không có header Authorization hợp lệ thì tiếp tục chuỗi (các endpoint public đã được trả bên trên)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("Không tìm thấy header Authorization hợp lệ, tiếp tục chuỗi filter");
            filterChain.doFilter(request, response);
            return;
        }

        // Trích xuất JWT token từ header
        jwt = authHeader.substring(7);
        log.debug("Đã trích xuất JWT token từ request");

        try {
            // Trích xuất username từ JWT
            username = jwtUtils.extractUsername(jwt);
            log.debug("Đã trích xuất username từ JWT: {}", username);

            // Kiểm tra xem user có đang được xác thực trong context chưa
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Kiểm tra token có bị thu hồi (revoked) trong cơ sở dữ liệu không
                if (tokenService.isTokenRevoked(jwt)) {
                    log.warn("Token đã bị thu hồi cho người dùng: {}", username);
                    filterChain.doFilter(request, response);
                    return;
                }

                // Tải thông tin người dùng
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                log.debug("Đã tải thông tin người dùng: {}", username);

                // Xác thực tính hợp lệ của token
                if (jwtUtils.isTokenValid(jwt, userDetails)) {
                    log.debug("JWT token hợp lệ cho người dùng: {}", username);

                    // Tạo đối tượng xác thực
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

                    // Gắn thông tin chi tiết xác thực (địa chỉ IP, User-Agent, v.v.)
                    // Đồng thời lưu raw JWT vào details để các lớp khác có thể lấy user_id từ token mà không cần truy vấn DB
                    java.util.Map<String, Object> details = new java.util.HashMap<>();
                    details.put("web", new WebAuthenticationDetailsSource().buildDetails(request));
                    details.put("jwt", jwt);
                    authToken.setDetails(details);

                    // Thiết lập xác thực vào SecurityContext
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("Đã thiết lập xác thực cho người dùng: {}", username);
                } else {
                    log.warn("JWT token không hợp lệ cho người dùng: {}", username);
                }
            }
        } catch (Exception e) {
            log.error("Không thể thiết lập xác thực cho người dùng: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Kiểm tra xem endpoint có công khai (public) hay không – nếu có thì không yêu cầu xác thực.
     */
    private boolean isPublicEndpoint(String requestURI, String httpMethod) {
        // Chỉ cho phép các request GET đến sản phẩm và danh mục là công khai.
        // Các phương thức khác (POST/PUT/DELETE) vẫn được bảo vệ trong SecurityConfig và PreAuthorize.
        boolean isGet = "GET".equalsIgnoreCase(httpMethod);

        return requestURI.startsWith("/api/v1/users/register") ||
                requestURI.startsWith("/api/v1/users/login") ||
                requestURI.startsWith("/api/v1/users/check/") ||
                requestURI.startsWith("/api/v1/users/refresh-token") ||
                // Endpoint công khai: danh sách và chi tiết sản phẩm (GET)
                (isGet && requestURI.startsWith("/api/v1/products")) ||
                // Endpoint công khai: danh sách danh mục (GET)
                (isGet && requestURI.startsWith("/api/v1/categories")) ||
                // Đường dẫn ảnh tĩnh (do WebMvcConfigurer phục vụ)
                requestURI.startsWith("/images/") ||
                // Truy cập công khai các bình luận (GET only)
                (isGet && requestURI.startsWith("/api/v1/products/") && requestURI.contains("/comments")) ||
                (isGet && requestURI.startsWith("/api/v1/comments")) ||
                // Endpoint công khai: khuyến mãi
                requestURI.startsWith("/api/v1/promotions/active") ||
                requestURI.startsWith("/api/v1/promotions/applicable") ||
                requestURI.startsWith("/api/v1/promotions/best") ||
                requestURI.startsWith("/api/v1/promotions/") && requestURI.contains("/calculate-discount") ||
                requestURI.startsWith("/api/v1/promotions/") && requestURI.contains("/is-active") ||
                requestURI.startsWith("/api/v1/promotions/") && requestURI.contains("/is-applicable") ||
                // swagger hoạt động
                requestURI.startsWith("/swagger-ui") ||
                requestURI.startsWith("/swagger-resources") ||
                requestURI.startsWith("/v3/api-docs") ||
                requestURI.startsWith("/webjars") ||

                // favicon và root page
                requestURI.equals("/favicon.ico") ||

                // Endpoint dành cho phát triển
                requestURI.startsWith("/h2-console") ||
                requestURI.startsWith("/actuator") ||
                requestURI.equals("/") ||
                requestURI.startsWith("/error");
    }
}
