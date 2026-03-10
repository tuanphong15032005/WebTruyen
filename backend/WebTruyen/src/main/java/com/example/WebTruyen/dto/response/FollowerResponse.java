package com.example.WebTruyen.dto.response;

import lombok.*;
import java.time.format.DateTimeFormatter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FollowerResponse {
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String authorPenName;
    private String followDate;
    private boolean isAuthor;
    
    public static FollowerResponse from(Object[] followerData) {
        return FollowerResponse.builder()
                .userId(((Number) followerData[0]).longValue())
                .username((String) followerData[1])
                .displayName((String) followerData[2])
                .avatarUrl((String) followerData[3])
                .authorPenName((String) followerData[4])
                .followDate(followerData[5] != null ? 
                    ((java.time.LocalDateTime) followerData[5]).format(DateTimeFormatter.ISO_LOCAL_DATE) : null)
                .isAuthor(((Number) followerData[6]).longValue() > 0)
                .build();
    }
}
