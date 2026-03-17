package com.example.WebTruyen.service.impl;

import com.example.WebTruyen.dto.request.UpdateProfileRequest;
import com.example.WebTruyen.dto.response.UserProfileResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.FollowUserRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.service.StorageService;
import com.example.WebTruyen.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {


    private final UserRepository userRepository;
    private final StorageService storageService;
    private final StoryRepository storyRepository;
    private final FollowUserRepository followUserRepository;
    private final PasswordEncoder passwordEncoder;


    @Override
    public UserProfileResponse getProfile(Long userId) {


        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));


        return mapToResponse(user);
    }


    @Override
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getCoverUrl() != null) {
            user.setCoverUrl(request.getCoverUrl());
        }
        if (request.getSettingsJson() != null) {
            user.setSettingsJson(request.getSettingsJson());
        }

        userRepository.save(user);

        return mapToResponse(user);
    }

    @Override
    public String uploadAvatar(Long userId, MultipartFile file) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            // Upload the avatar image using StorageService
            String avatarUrl = storageService.saveImage(file);
            
            // Update user's avatar URL in database
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);
            
            return avatarUrl;
        } catch (Exception ex) {
            throw new RuntimeException("Failed to upload avatar: " + ex.getMessage(), ex);
        }
    }

    @Override
    public String uploadCover(Long userId, MultipartFile file) {
        System.out.println("=== UPLOAD COVER START ===");
        System.out.println("User ID: " + userId);
        System.out.println("File: " + (file != null ? file.getOriginalFilename() : "null"));
        System.out.println("File size: " + (file != null ? file.getSize() : 0));
        System.out.println("Storage service: " + (storageService != null ? storageService.getClass().getSimpleName() : "null"));
        
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is null or empty");
        }
        
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        try {
            System.out.println("Calling storageService.saveImage()...");
            String coverUrl = storageService.saveImage(file);
            System.out.println("Cover uploaded successfully: " + coverUrl);
            
            if (coverUrl == null) {
                throw new RuntimeException("Storage service returned null URL");
            }
            
            // Update user's cover URL in database
            user.setCoverUrl(coverUrl);
            userRepository.save(user);
            
            System.out.println("=== UPLOAD COVER SUCCESS ===");
            return coverUrl;
        } catch (Exception ex) {
            System.err.println("=== UPLOAD COVER FAILED ===");
            System.err.println("Error: " + ex.getMessage());
            ex.printStackTrace();
            throw new RuntimeException("Failed to upload cover: " + ex.getMessage(), ex);
        }
    }


    private UserProfileResponse mapToResponse(UserEntity user) {


        UserProfileResponse response = new UserProfileResponse();


        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setDisplayName(user.getDisplayName());
        response.setBio(user.getBio());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setCoverUrl(user.getCoverUrl());
        response.setSettingsJson(user.getSettingsJson());

        // Calculate statistics
        Long storiesCount = 0L;
        Long followersCount = 0L;
        
        try {
            System.out.println("Counting stories for user: " + user.getId());
            storiesCount = storyRepository.countByAuthor_Id(user.getId());
            System.out.println("Stories count: " + storiesCount);
        } catch (Exception e) {
            System.err.println("Error counting stories: " + e.getMessage());
            e.printStackTrace();
        }
        
        try {
            System.out.println("Counting followers for user: " + user.getId());
            followersCount = followUserRepository.countByTargetUserId(user.getId());
            System.out.println("Followers count: " + followersCount);
        } catch (Exception e) {
            System.err.println("Error counting followers: " + e.getMessage());
            e.printStackTrace();
        }

        response.setStoriesCount(storiesCount);
        response.setFollowersCount(followersCount);


        return response;
    }

    @Override
    public UserEntity findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }

    @Override
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        System.out.println("=== CHANGE PASSWORD ===");
        System.out.println("User ID: " + userId);
        
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        System.out.println("User found: " + user.getUsername());
        
        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            System.out.println("Old password does not match");
            throw new RuntimeException("Old password is incorrect");
        }
        
        System.out.println("Old password verified");
        
        // Check if new password is same as old
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            System.out.println("New password is same as old password");
            throw new RuntimeException("New password must be different from old password");
        }
        
        // Encode and set new password
        String encodedNewPassword = passwordEncoder.encode(newPassword);
        user.setPasswordHash(encodedNewPassword);
        
        userRepository.save(user);
        
        System.out.println("Password changed successfully for user: " + user.getUsername());
    }
}
