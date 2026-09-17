package com.regarsport.auth.dto;

import java.io.Serializable;
import java.time.Instant;

public record UserResponse(
    Long id,
    String fullName,
    String email,
    String role,
    String avatarUrl,
    Instant createdAt
) implements Serializable {}
