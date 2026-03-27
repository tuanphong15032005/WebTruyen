package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record AdminUserResponse(
        Long id,
        String username,
        String email,
        String displayName,
        String avatar,
        List<String> roles,
        LocalDateTime createdAt
) {}
