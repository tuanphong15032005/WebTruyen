package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

public record AdminViolationReportResponse(
        Long reportId,
        String violationType,
        String reportedContent,
        String reportedBy,
        String reportDetails,
        String reportStatus,
        String actionResult,
        String actionRaw,
        Long targetId,
        LocalDateTime reportedAt
) {}
