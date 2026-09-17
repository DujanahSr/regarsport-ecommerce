package com.regarsport.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.regarsport.auth.dto.AuthResponse;
import com.regarsport.auth.dto.LoginRequest;
import com.regarsport.auth.dto.RefreshTokenRequest;
import com.regarsport.auth.dto.RegisterRequest;
import com.regarsport.auth.dto.UserResponse;
import com.regarsport.auth.security.CustomUserDetailsService;
import com.regarsport.auth.security.JwtService;
import com.regarsport.auth.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AuthController WebMvc Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("POST /api/v1/auth/register should return 201 Created")
    void testRegisterEndpoint_Success() throws Exception {
        RegisterRequest request = new RegisterRequest("Abu Dujanah", "abu@example.com", "password123");
        UserResponse userResponse = new UserResponse(1L, "Abu Dujanah", "abu@example.com", "ROLE_CUSTOMER", null, Instant.now());
        AuthResponse authResponse = AuthResponse.of("mock-access", "mock-refresh", 86400000L, userResponse);

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mock-access"))
                .andExpect(jsonPath("$.data.user.email").value("abu@example.com"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register with invalid email should return 400 Bad Request")
    void testRegisterEndpoint_InvalidEmail_Returns400() throws Exception {
        RegisterRequest request = new RegisterRequest("Abu Dujanah", "invalid-email-format", "123");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login should return 200 OK")
    void testLoginEndpoint_Success() throws Exception {
        LoginRequest request = new LoginRequest("abu@example.com", "password123");
        UserResponse userResponse = new UserResponse(1L, "Abu Dujanah", "abu@example.com", "ROLE_CUSTOMER", null, Instant.now());
        AuthResponse authResponse = AuthResponse.of("mock-access", "mock-refresh", 86400000L, userResponse);

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mock-access"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh should return 200 OK")
    void testRefreshTokenEndpoint_Success() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest("mock-refresh-token");
        UserResponse userResponse = new UserResponse(1L, "Abu Dujanah", "abu@example.com", "ROLE_CUSTOMER", null, Instant.now());
        AuthResponse authResponse = AuthResponse.of("new-access-token", "mock-refresh-token", 86400000L, userResponse);

        when(authService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("new-access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("mock-refresh-token"));
    }
}
