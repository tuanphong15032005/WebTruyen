package com.example.WebTruyen.service.impl;

import com.example.WebTruyen.dto.request.UpdateProfileRequest;
import com.example.WebTruyen.dto.response.UserProfileResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {


    private final UserRepository userRepository;


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
