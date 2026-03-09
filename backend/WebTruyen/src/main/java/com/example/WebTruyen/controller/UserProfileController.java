package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.UpdateProfileRequest;
import com.example.WebTruyen.dto.response.UserProfileResponse;
import com.example.WebTruyen.dto.response.UserRoleResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserRoleEntity;
import com.example.WebTruyen.repository.UserRoleRepository;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class UserProfileController {
    private final UserService userService;
    private final UserRoleRepository userRoleRepository;


    @GetMapping("/{userId}")
    public UserProfileResponse getProfile(@PathVariable Long userId) {


        return userService.getProfile(userId);
    }


    @GetMapping("/{userId}/roles")
    public List<UserRoleResponse> getUserRoles(@PathVariable Long userId) {


        List<UserRoleEntity> userRoles = userRoleRepository.findByUser_Id(userId);
        
        return userRoles.stream()
                .map(userRole -> UserRoleResponse.builder()
                        .userId(userRole.getUser().getId())
                        .roleId(userRole.getRole().getId())
                        .roleCode(userRole.getRole().getCode())
                        .roleName(userRole.getRole().getName())
                        .roleDescription(userRole.getRole().getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    @PostMapping("/{userId}/avatar")
    public Map<String, String> uploadAvatar(@PathVariable Long userId, @RequestParam("avatar") MultipartFile file) {
        try {
            String avatarUrl = userService.uploadAvatar(userId, file);
            if (avatarUrl == null) throw new RuntimeException("Avatar upload returned null url");
            return Map.of("avatarUrl", avatarUrl);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Avatar upload failed", ex);
        }
    }


    @PutMapping("/{userId}")
    public UserProfileResponse updateProfile(
            @PathVariable Long userId,
            @RequestBody UpdateProfileRequest request) {


        return userService.updateProfile(userId, request);
    }
}
