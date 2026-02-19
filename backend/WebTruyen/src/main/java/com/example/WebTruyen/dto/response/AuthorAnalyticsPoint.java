package com.example.WebTruyen.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthorAnalyticsPoint {
    private String label;
    private Long value;
}
