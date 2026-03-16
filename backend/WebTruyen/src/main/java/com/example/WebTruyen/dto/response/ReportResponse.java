package com.example.WebTruyen.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReportResponse {

    private Long id;
    private String status;
    private LocalDateTime createdAt;

    public ReportResponse(Long id, String status, LocalDateTime createdAt) {
        this.id = id;
        this.status = status;
        this.createdAt = createdAt;
    }
}
