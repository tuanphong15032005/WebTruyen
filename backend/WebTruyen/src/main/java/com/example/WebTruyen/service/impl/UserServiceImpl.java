package com.example.WebTruyen.service.impl;

import com.example.WebTruyen.dto.request.UpdateProfileRequest;
import com.example.WebTruyen.dto.response.UserProfileResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.service.StorageService;
import com.example.WebTruyen.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {


    private final UserRepository userRepository;
    private final StorageService storageService;


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


    private UserProfileResponse mapToResponse(UserEntity user) {


        UserProfileResponse response = new UserProfileResponse();


        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setDisplayName(user.getDisplayName());
        response.setBio(user.getBio());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setSettingsJson(user.getSettingsJson());


        return response;
    }
}
