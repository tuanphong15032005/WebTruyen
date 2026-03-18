package com.example.WebTruyen.dto.response;

import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AchievementListResponse {
    
    private List<AchievementResponse> achievements;
    private Integer totalCount;
    private Integer page;
    private Integer size;
    private Integer totalPages;
}
