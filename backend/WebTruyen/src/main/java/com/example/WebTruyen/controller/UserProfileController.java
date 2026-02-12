package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.UpdateProfileRequest;
import com.example.WebTruyen.dto.response.UserProfileResponse;
import com.example.WebTruyen.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/profile")
@RequiredArgsConstructor
public class UserProfileController {
    private final UserService userService;


    @GetMapping("/{userId}")
    public UserProfileResponse getProfile(@PathVariable Long userId) {


        return userService.getProfile(userId);
    }


    @PutMapping("/{userId}")
    public UserProfileResponse updateProfile(
            @PathVariable Long userId,
            @RequestBody UpdateProfileRequest request) {


        return userService.updateProfile(userId, request);
    }
}
