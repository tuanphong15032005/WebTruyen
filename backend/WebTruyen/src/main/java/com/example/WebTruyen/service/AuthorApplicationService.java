package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.AuthorApplicationRequest;
import com.example.WebTruyen.entity.keys.UserRoleId;
import com.example.WebTruyen.entity.model.CoreIdentity.RoleEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserRoleEntity;
import com.example.WebTruyen.repository.RoleRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.UserRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthorApplicationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Transactional
    public void applyForAuthor(Long userId, AuthorApplicationRequest request) {
        // Check if user exists
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user already has author role
        boolean hasAuthorRole = user.getUserRoles().stream()
                .anyMatch(userRole -> userRole.getRole().getCode().equals("AUTHOR"));
        
        if (hasAuthorRole) {
            throw new RuntimeException("User already has author role");
        }

        // Get author role
        RoleEntity authorRole = roleRepository.findByCode("AUTHOR")
                .orElseThrow(() -> new RuntimeException("Author role not found"));

        // Update user's author profile information
        user.setAuthorPenName(request.getPenName());
        user.setAuthorProfileBio(request.getBio());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Assign author role to user
        UserRoleEntity userRole = UserRoleEntity.builder()
                                                .id(new UserRoleId(user.getId(), authorRole.getId()))
                                                .user(user)
                                                .role(authorRole)
                                                .assignedAt(LocalDateTime.now())
                                                .build();

        userRoleRepository.save(userRole);

        userRoleRepository.save(userRole);
    }

    public boolean hasAuthorRole(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return user.getUserRoles().stream()
                .anyMatch(userRole -> userRole.getRole().getCode().equals("AUTHOR"));
    }
}
