package com.example.WebTruyen.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserPortfolioResponse {
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String authorPenName;  // Added for ISSUE 2
    private String joinDate;
    private String bio;
    private boolean author;  // Changed from isAuthor to author
    private Long storiesCount;
    private Long followersCount;
    private Long commentsCount;
}
