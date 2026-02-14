package com.example.WebTruyen.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ModerationActionRequest {
    private String reason;
    private String notes;
}
