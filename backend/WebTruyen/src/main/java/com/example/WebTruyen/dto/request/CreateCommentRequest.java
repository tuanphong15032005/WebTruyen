package com.example.WebTruyen.dto.request;

public record CreateCommentRequest(
        String content,
        Long parentCommentId
) {}
