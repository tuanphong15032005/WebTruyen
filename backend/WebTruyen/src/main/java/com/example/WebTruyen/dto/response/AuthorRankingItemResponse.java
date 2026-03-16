package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorRankingItemResponse {
    private Long userId;
    private String displayName;
    private String authorPenName;
    private String avatarUrl;
    private Long followersCount;
    private Integer rank;
}
