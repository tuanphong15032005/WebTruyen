package com.example.WebTruyen.dto.request;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateProfileRequest {
    private String displayName;


    private String bio;


    private String avatarUrl;


    private String settingsJson;
}
