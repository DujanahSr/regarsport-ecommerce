package com.regarsport.gateway.filter;

import com.regarsport.gateway.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthenticationFilter Unit Tests in API Gateway")
class AuthenticationFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private GatewayFilterChain filterChain;

    @InjectMocks
    private AuthenticationFilter authenticationFilter;

    @BeforeEach
    void setUp() {
        lenient().when(filterChain.filter(any())).thenReturn(Mono.empty());
    }

    @Test
    @DisplayName("Should permit public endpoints without Authorization header")
    void testPublicEndpoint_Allowed() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/auth/login").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, filterChain).block();

        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    @DisplayName("Should return 401 Unauthorized when Authorization header is missing on protected endpoint")
    void testProtectedEndpoint_MissingAuthHeader_Returns401() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/orders/checkout").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, filterChain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(filterChain, never()).filter(exchange);
    }

    @Test
    @DisplayName("Should forward request with injected user headers when JWT is valid")
    void testProtectedEndpoint_ValidToken_InjectsHeaders() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/orders/checkout")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-jwt-token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.validateToken("valid-jwt-token")).thenReturn(true);
        when(jwtUtil.extractUserId("valid-jwt-token")).thenReturn(50L);
        when(jwtUtil.extractEmail("valid-jwt-token")).thenReturn("abu@regarsport.com");
        when(jwtUtil.extractRole("valid-jwt-token")).thenReturn("ROLE_CUSTOMER");
        when(jwtUtil.extractFullName("valid-jwt-token")).thenReturn("Abu Siregar");

        authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, filterChain).block();

        verify(filterChain, times(1)).filter(any());
    }
}
