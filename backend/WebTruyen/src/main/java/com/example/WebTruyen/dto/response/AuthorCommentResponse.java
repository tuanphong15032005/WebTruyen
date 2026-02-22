package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record AuthorCommentResponse(
        Long id,
        Long userId,
        String displayName,
        String avatarUrl,
        String content,
        LocalDateTime postedTime,
        String status,
        Long parentCommentId,
        Integer depth,
        List<AuthorCommentResponse> replies
) {}
