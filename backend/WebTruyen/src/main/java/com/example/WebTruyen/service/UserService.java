package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.UpdateProfileRequest;
import com.example.WebTruyen.dto.response.UserProfileResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    UserProfileResponse getProfile(Long userId);

    UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request);
    
    String uploadAvatar(Long userId, MultipartFile file);
    
    String uploadCover(Long userId, MultipartFile file);
    
    void changePassword(Long userId, String oldPassword, String newPassword);
}
