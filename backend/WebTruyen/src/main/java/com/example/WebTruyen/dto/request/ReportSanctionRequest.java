package com.example.WebTruyen.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportSanctionRequest {
    private String sanctionType;
    private Integer banHours;
    private String reason;
    private String notes;
}
