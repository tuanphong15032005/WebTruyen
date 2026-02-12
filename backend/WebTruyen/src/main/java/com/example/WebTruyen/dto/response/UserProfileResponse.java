package com.example.WebTruyen.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfileResponse {
    private Long id;
    private String email;
    private String username;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private String settingsJson;
}
