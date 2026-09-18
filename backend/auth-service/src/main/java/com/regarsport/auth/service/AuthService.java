package com.regarsport.auth.service;

import com.regarsport.auth.dto.*;
import com.regarsport.auth.entity.Role;
import com.regarsport.auth.entity.User;
import com.regarsport.auth.mapper.UserMapper;
import com.regarsport.auth.repository.UserRepository;
import com.regarsport.auth.security.JwtService;
import com.regarsport.common.exception.BadRequestException;
import com.regarsport.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.regarsport.common.dto.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        log.info("Processing user registration for email: {}", email);

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Email already in use: " + email);
        }

        User user = User.builder()
                .fullName(request.fullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .role(Role.ROLE_CUSTOMER)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User successfully created with id: {}", savedUser.getId());

        UserResponse userResponse = userMapper.toResponse(savedUser);

        String accessToken = jwtService.generateAccessToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().name(),
                savedUser.getFullName()
        );
        String refreshToken = jwtService.generateRefreshToken(savedUser.getId(), savedUser.getEmail());

        return AuthResponse.of(accessToken, refreshToken, jwtService.getAccessTokenExpirationMs(), userResponse);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        log.info("Processing login attempt for email: {}", email);

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }

        if (Boolean.FALSE.equals(user.getActive())) {
            throw new BadRequestException("Akun Anda telah dinonaktifkan/disuspend oleh Admin. Silakan hubungi customer support.");
        }

        UserResponse userResponse = userMapper.toResponse(user);

        String accessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getFullName()
        );
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail());

        log.info("User {} successfully logged in", email);
        return AuthResponse.of(accessToken, refreshToken, jwtService.getAccessTokenExpirationMs(), userResponse);
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.refreshToken();

        if (!jwtService.validateToken(token)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }

        String email = jwtService.extractEmail(token);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        UserResponse userResponse = userMapper.toResponse(user);

        String newAccessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getFullName()
        );

        return AuthResponse.of(newAccessToken, token, jwtService.getAccessTokenExpirationMs(), userResponse);
    }

    public UserResponse getCurrentUserProfile(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        log.info("Updating profile for user: {}", email);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        user.setFullName(request.fullName().trim());
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl().trim());
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(request.phoneNumber().trim());
        }
        if (request.address() != null) {
            user.setAddress(request.address().trim());
        }
        if (request.city() != null) {
            user.setCity(request.city().trim());
        }
        if (request.postalCode() != null) {
            user.setPostalCode(request.postalCode().trim());
        }
        if (request.bio() != null) {
            user.setBio(request.bio().trim());
        }

        User updatedUser = userRepository.save(user);
        return userMapper.toResponse(updatedUser);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        log.info("Processing password change for user: {}", email);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Password saat ini yang Anda masukkan salah");
        }

        if (request.newPassword() == null || request.newPassword().trim().length() < 6) {
            throw new BadRequestException("Password baru minimal 6 karakter");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword().trim()));
        userRepository.save(user);
        log.info("Password successfully changed for user: {}", email);
    }

    public PageResponse<UserResponse> getAllUsers(String search, String roleStr, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(100, Math.max(1, size)), Sort.by("id").descending());
        Role role = null;
        if (roleStr != null && !roleStr.isBlank()) {
            try {
                role = roleStr.toUpperCase().startsWith("ROLE_")
                        ? Role.valueOf(roleStr.toUpperCase())
                        : Role.valueOf("ROLE_" + roleStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        Page<User> userPage;
        boolean hasSearch = search != null && !search.trim().isBlank();
        if (hasSearch && role != null) {
            userPage = userRepository.searchUsersByRole(search.trim(), role, pageable);
        } else if (hasSearch) {
            userPage = userRepository.searchUsers(search.trim(), pageable);
        } else if (role != null) {
            userPage = userRepository.findByRole(role, pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        List<UserResponse> content = userPage.getContent().stream()
                .map(userMapper::toResponse)
                .toList();

        return new PageResponse<>(
                content,
                userPage.getNumber() + 1,
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages(),
                userPage.isFirst(),
                userPage.isLast()
        );
    }

    @Transactional
    public UserResponse updateUserRole(Long userId, String roleStr) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Role newRole = roleStr.toUpperCase().startsWith("ROLE_")
                ? Role.valueOf(roleStr.toUpperCase())
                : Role.valueOf("ROLE_" + roleStr.toUpperCase());
        user.setRole(newRole);
        User saved = userRepository.save(user);
        return userMapper.toResponse(saved);
    }

    @Transactional
    public UserResponse updateUserStatus(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setActive(active);
        User saved = userRepository.save(user);
        log.info("User id {} status updated to active={}", userId, active);
        return userMapper.toResponse(saved);
    }

    public UserStatsResponse getUserStats() {
        long total = userRepository.count();
        long admins = userRepository.countByRole(Role.ROLE_ADMIN);
        long customers = userRepository.countByRole(Role.ROLE_CUSTOMER);
        return new UserStatsResponse(total, admins, customers);
    }
}
