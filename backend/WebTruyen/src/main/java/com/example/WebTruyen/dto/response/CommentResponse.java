package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record CommentResponse(
        Long id,
        Long userId,
        String username,
        String avatarUrl,
        String content,
        LocalDateTime createdAt,
        Long parentCommentId,
        Integer depth,
        List<CommentResponse> replies
) {}
