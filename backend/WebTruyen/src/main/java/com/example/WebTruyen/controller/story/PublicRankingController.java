package com.example.WebTruyen.controller.story;

import com.example.WebTruyen.dto.response.AuthorRankingItemResponse;
import com.example.WebTruyen.dto.response.StoryResponse;
import com.example.WebTruyen.service.PublicRankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/ranking")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PublicRankingController {

    private final PublicRankingService publicRankingService;

    /** Xếp hạng tác giả theo lượt theo dõi */
    @GetMapping("/authors")
    public List<AuthorRankingItemResponse> getAuthorRanking(
            @RequestParam(defaultValue = "50") int limit
    ) {
        return publicRankingService.getAuthorRankingByFollowers(Math.min(limit, 100));
    }

    /** Top truyện theo lượt theo dõi (lưu thư viện) */
    @GetMapping("/stories/by-follows")
    public List<StoryResponse> getTopStoriesByFollows(
            @RequestParam(defaultValue = "50") int limit
    ) {
        return publicRankingService.getTopStoriesByFollowCount(Math.min(limit, 100));
    }
}
