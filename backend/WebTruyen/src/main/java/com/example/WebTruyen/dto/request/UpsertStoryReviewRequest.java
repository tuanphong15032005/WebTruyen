package com.example.WebTruyen.dto.request;

public record UpsertStoryReviewRequest(
        Integer rating,
        String title,
        String content
) {}
