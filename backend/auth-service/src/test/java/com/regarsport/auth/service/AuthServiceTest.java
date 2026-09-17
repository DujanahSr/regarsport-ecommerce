package com.regarsport.auth.service;

import com.regarsport.auth.dto.AuthResponse;
import com.regarsport.auth.dto.LoginRequest;
import com.regarsport.auth.dto.RefreshTokenRequest;
import com.regarsport.auth.dto.RegisterRequest;
import com.regarsport.auth.dto.UserResponse;
import com.regarsport.auth.entity.Role;
import com.regarsport.auth.entity.User;
import com.regarsport.auth.mapper.UserMapper;
import com.regarsport.auth.repository.UserRepository;
import com.regarsport.auth.security.JwtService;
import com.regarsport.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private UserResponse sampleUserResponse;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setFullName("Abu Dujanah");
        sampleUser.setEmail("abu@example.com");
        sampleUser.setPassword("encoded_password_hash");
        sampleUser.setRole(Role.ROLE_CUSTOMER);
        sampleUser.setCreatedAt(Instant.now());

        sampleUserResponse = new UserResponse(
                1L, "Abu Dujanah", "abu@example.com", "ROLE_CUSTOMER", null, Instant.now()
        );
    }

    @Test
    @DisplayName("Should register new user successfully")
    void testRegister_Success() {
        RegisterRequest request = new RegisterRequest("Abu Dujanah", "abu@example.com", "password123");

        when(userRepository.existsByEmailIgnoreCase("abu@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded_password_hash");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(userMapper.toResponse(sampleUser)).thenReturn(sampleUserResponse);
        when(jwtService.generateAccessToken(1L, "abu@example.com", "ROLE_CUSTOMER", "Abu Dujanah")).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(1L, "abu@example.com")).thenReturn("mock-refresh-token");
        when(jwtService.getAccessTokenExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("mock-access-token");
        assertThat(response.refreshToken()).isEqualTo("mock-refresh-token");
        assertThat(response.user().email()).isEqualTo("abu@example.com");

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when registering with duplicate email")
    void testRegister_DuplicateEmail_ThrowsException() {
        RegisterRequest request = new RegisterRequest("Abu Dujanah", "abu@example.com", "password123");
        when(userRepository.existsByEmailIgnoreCase("abu@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email already in use");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void testLogin_Success() {
        LoginRequest request = new LoginRequest("abu@example.com", "password123");

        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encoded_password_hash")).thenReturn(true);
        when(userMapper.toResponse(sampleUser)).thenReturn(sampleUserResponse);
        when(jwtService.generateAccessToken(1L, "abu@example.com", "ROLE_CUSTOMER", "Abu Dujanah")).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(1L, "abu@example.com")).thenReturn("mock-refresh-token");
        when(jwtService.getAccessTokenExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("mock-access-token");
        assertThat(response.user().fullName()).isEqualTo("Abu Dujanah");
    }

    @Test
    @DisplayName("Should throw BadRequestException when login password is invalid")
    void testLogin_InvalidPassword_ThrowsException() {
        LoginRequest request = new LoginRequest("abu@example.com", "wrongpassword");

        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpassword", "encoded_password_hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid email or password");

        verify(jwtService, never()).generateAccessToken(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should throw BadRequestException when email not found on login")
    void testLogin_UserNotFound_ThrowsException() {
        LoginRequest request = new LoginRequest("unknown@example.com", "password123");

        when(userRepository.findByEmailIgnoreCase("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("Should refresh access token successfully with valid refresh token")
    void testRefreshToken_Success() {
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");

        when(jwtService.validateToken("valid-refresh-token")).thenReturn(true);
        when(jwtService.extractEmail("valid-refresh-token")).thenReturn("abu@example.com");
        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));
        when(userMapper.toResponse(sampleUser)).thenReturn(sampleUserResponse);
        when(jwtService.generateAccessToken(1L, "abu@example.com", "ROLE_CUSTOMER", "Abu Dujanah")).thenReturn("new-access-token");
        when(jwtService.getAccessTokenExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.refreshToken(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.refreshToken()).isEqualTo("valid-refresh-token");
    }

    @Test
    @DisplayName("Should throw BadRequestException when refresh token is invalid")
    void testRefreshToken_InvalidToken_ThrowsException() {
        RefreshTokenRequest request = new RefreshTokenRequest("corrupted-token");

        when(jwtService.validateToken("corrupted-token")).thenReturn(false);

        assertThatThrownBy(() -> authService.refreshToken(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid or expired refresh token");
    }
}
