package com.regarsport.auth.mapper;

import com.regarsport.auth.dto.UserResponse;
import com.regarsport.auth.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) return null;
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getAvatarUrl(),
                user.getCreatedAt()
        );
    }
}
