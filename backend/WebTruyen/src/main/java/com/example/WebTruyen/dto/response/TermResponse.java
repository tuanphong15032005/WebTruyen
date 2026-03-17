package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

public record TermResponse(
        String code,
        String title,
        String content,
        LocalDateTime updatedAt
) {}
