package com.regarsport.auth.controller;

import com.regarsport.auth.dto.UserResponse;
import com.regarsport.auth.dto.UserRoleUpdateRequest;
import com.regarsport.auth.dto.UserStatsResponse;
import com.regarsport.auth.service.AuthService;
import com.regarsport.common.dto.ApiResponse;
import com.regarsport.common.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin User Management", description = "Endpoints for managing users, roles, and statistics")
@SecurityRequirement(name = "bearerAuth")
public class AdminUserController {

    private final AuthService authService;

    @GetMapping
    @Operation(summary = "Admin: List users", description = "Get paginated users with optional search and role filter")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        PageResponse<UserResponse> response = authService.getAllUsers(search, role, page, limit);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/role")
    @Operation(summary = "Admin: Update user role", description = "Update a user's role (e.g. ROLE_ADMIN or ROLE_CUSTOMER)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UserRoleUpdateRequest request
    ) {
        UserResponse response = authService.updateUserRole(id, request.role());
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully", response));
    }

    @GetMapping("/stats")
    @Operation(summary = "Admin: User statistics", description = "Get platform user count statistics")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getUserStats() {
        UserStatsResponse stats = authService.getUserStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
