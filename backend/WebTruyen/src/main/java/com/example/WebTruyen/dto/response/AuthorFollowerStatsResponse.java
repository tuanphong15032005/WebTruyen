package com.example.WebTruyen.dto.response;

import java.util.List;

public record AuthorFollowerStatsResponse(
        Long totalFollowers,
        Long newFollowersLast7Days,
        Long newFollowersLast30Days,
        List<AuthorPerformancePointResponse> followerGrowthOverTime
) {}
