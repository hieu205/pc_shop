package com.computershop.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for user login
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    
    @NotBlank(message = "Identifier is required")
    // identifier can be username, email or phone
    private String identifier;
    
    @NotBlank(message = "Password is required")
    private String password;
}
