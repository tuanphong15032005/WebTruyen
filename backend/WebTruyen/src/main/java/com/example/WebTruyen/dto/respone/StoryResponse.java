package com.example.WebTruyen.dto.respone;




import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record StoryResponse(
        Long id,
        Long authorId,
        String authorPenName,
        String translatorPenName,
        String title,
        String summaryHtml,
        String coverUrl,
        String status,
        String kind,
        String completionStatus,
        LocalDateTime completedAt,
        String originalAuthorName,
        Long originalAuthorUserId,
        Long ratingSum,
        Integer ratingCount,
        BigDecimal ratingAvg,
        Long readerCount,
        Long wordCount,
        LocalDateTime lastUpdatedAt,
        List<TagDto> tags,
        LocalDateTime createdAt
) {}
