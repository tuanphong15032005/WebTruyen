package com.example.WebTruyen.controller.admin;

import com.example.WebTruyen.dto.request.AdminRoleUpdateRequest;
import com.example.WebTruyen.dto.response.AdminUserResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.UserRoleRepository;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final UserRoleRepository userRoleRepository;

    @GetMapping
    public Page<AdminUserResponse> searchUsers(
            @RequestParam(required = false) String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        requireMod(requireUser(userPrincipal));
        return adminUserService.searchUsers(username, PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public AdminUserResponse getUserDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        requireMod(requireUser(userPrincipal));
        return adminUserService.getUserById(id);
    }

    @PutMapping("/{id}/roles")
    public Map<String, String> updateUserRoles(
            @PathVariable Long id,
            @RequestBody AdminRoleUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        requireMod(requireUser(userPrincipal));
        adminUserService.updateUserRoles(id, request);
        return Map.of("message", "Cập nhật quyền thành công");
    }

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }

    private void requireMod(UserEntity currentUser) {
        Long userId = currentUser.getId();
        boolean allowed = userRoleRepository.existsByUser_IdAndRole_Code(userId, "MOD");
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
    }
}
