package com.regarsport.auth.dto;

import java.io.Serializable;
import java.time.Instant;

public record UserResponse(
    Long id,
    String fullName,
    String email,
    String role,
    String avatarUrl,
    Boolean active,
    Instant createdAt
) implements Serializable {
    public UserResponse(Long id, String fullName, String email, String role, String avatarUrl, Instant createdAt) {
        this(id, fullName, email, role, avatarUrl, true, createdAt);
    }
}
