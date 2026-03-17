package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record CommentResponse(
        Long id,
        Long userId,
        String username,
        String avatarUrl,
        String content,
        Boolean hidden,
        Boolean spoiler,
        LocalDateTime createdAt,
        Long parentCommentId,
        Long parentUserId,
        String parentUsername,
        Integer depth,
        List<CommentResponse> replies
) {}
