package com.example.WebTruyen.dto.respone;




import java.time.LocalDateTime;
import java.util.List;

public record StoryResponse(
        Long id,
        Long authorId,
        String authorPenName,
        String title,
        String summaryHtml,
        String coverUrl,
        String status,
        List<TagDto> tags,
        LocalDateTime createdAt
) {}
