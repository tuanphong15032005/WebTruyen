package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.AdminRoleUpdateRequest;
import com.example.WebTruyen.dto.response.AdminUserResponse;
import com.example.WebTruyen.entity.keys.UserRoleId;
import com.example.WebTruyen.entity.model.CoreIdentity.RoleEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserRoleEntity;
import com.example.WebTruyen.repository.RoleRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> searchUsers(String username, Pageable pageable) {
        Page<UserEntity> users = userRepository.searchUsers(username, pageable);
        return users.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long id) {
        UserEntity user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toResponse(user);
    }

    @Transactional
    public void updateUserRoles(Long id, AdminRoleUpdateRequest request) {
        UserEntity user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.getRoles() == null) {
            return;
        }

        List<UserRoleEntity> currentRoles = user.getUserRoles();
        Set<String> currentRoleCodes = currentRoles.stream()
                .map(ur -> ur.getRole().getCode().toUpperCase())
                .collect(Collectors.toSet());

        Set<String> targetRoleCodes = request.getRoles().stream()
                .map(String::toUpperCase)
                .collect(Collectors.toSet());

        // Luôn luôn đảm bảo user có ít nhất role Độc giả (READER)
        targetRoleCodes.add("READER");

        // Xóa những role không còn nằm trong mục tiêu
        for (UserRoleEntity ur : currentRoles) {
            String code = ur.getRole().getCode().toUpperCase();
            if (!targetRoleCodes.contains(code)) {
                userRoleRepository.deleteByUser_IdAndRole_Id(user.getId(), ur.getRole().getId());
            }
        }

        // Thêm những role mới
        for (String targetCode : targetRoleCodes) {
            if (!currentRoleCodes.contains(targetCode)) {
                RoleEntity role = roleRepository.findByCode(targetCode)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role not found: " + targetCode));

                UserRoleEntity newUserRole = UserRoleEntity.builder()
                        .id(new UserRoleId(user.getId(), role.getId()))
                        .user(user)
                        .role(role)
                        .assignedAt(LocalDateTime.now())
                        .build();

                userRoleRepository.save(newUserRole);
            }
        }
    }

    private AdminUserResponse toResponse(UserEntity user) {
        List<String> roles = user.getUserRoles().stream()
                .map(ur -> ur.getRole().getCode())
                .toList();
        
        return new AdminUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                roles,
                user.getCreatedAt()
        );
    }
}
