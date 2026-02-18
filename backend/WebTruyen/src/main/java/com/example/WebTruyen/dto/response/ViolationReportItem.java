package com.example.WebTruyen.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ViolationReportItem {
    private Long reportId;
    private String violationType;
    private String reportedContentType;
    private String reportedContent;
    private String reportedBy;
    private String reportDetails;
    private LocalDateTime reportedAt;
    private String reportStatus;
    private String handledAction;
    private LocalDateTime handledAt;
}
