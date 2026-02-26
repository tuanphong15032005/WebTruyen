package com.example.WebTruyen.dto.response;

import java.util.List;

// Minhdq - 26/02/2026
// [Add author-follower-stats-response-dto - V1 - branch: clone-minhfinal2]
public record AuthorFollowerStatsResponse(
        Long totalFollowers,
        Long newFollowersLast7Days,
        Long newFollowersLast30Days,
        List<AuthorPerformancePointResponse> followerGrowthOverTime
) {}
