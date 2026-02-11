package com.example.WebTruyen.controller;


import com.example.WebTruyen.dto.request.CreateChapterRequest;
import com.example.WebTruyen.dto.request.CreateStoryRequest;
import com.example.WebTruyen.dto.request.CreateVolumeRequest;
import com.example.WebTruyen.dto.respone.CreateChapterResponse;
import com.example.WebTruyen.dto.respone.CreateVolumeResponse;
import com.example.WebTruyen.dto.respone.StoryResponse;
import com.example.WebTruyen.dto.respone.VolumeSummaryResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.ChapterService;
import com.example.WebTruyen.service.StoryService;
import com.example.WebTruyen.service.VolumeService;
import lombok.RequiredArgsConstructor;
import org.hibernate.query.Page;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;
    private final VolumeService volumeService;
    private final ChapterService chapterService;


    @PostMapping(value = "/stories", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public <userPrincipal> StoryResponse createStory(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "cover", required = false) MultipartFile cover,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) throws Exception {
        CreateStoryRequest data = new ObjectMapper().readValue(dataJson, CreateStoryRequest.class);
        UserEntity currentUser = userPrincipal.getUser();
        return storyService.createStory(currentUser, data, cover);
    }

    // Lấy thông tin chi tiết truyện theo id
    @GetMapping("/stories/{storyId}")
    public StoryResponse getStory(@PathVariable Integer storyId) {
        return storyService.getStoryById(storyId);
    }

    // C?p nh?t truy?n theo id
    @PutMapping(value = "/stories/{storyId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StoryResponse updateStory(
            @PathVariable Integer storyId,
            @RequestPart("data") String dataJson,
            @RequestPart(value = "cover", required = false) MultipartFile cover,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) throws Exception {
        CreateStoryRequest data = new ObjectMapper().readValue(dataJson, CreateStoryRequest.class);
        UserEntity currentUser = userPrincipal.getUser();
        return storyService.updateStory(currentUser, storyId, data, cover);
    }

    // L?y danh s?ch volume v? chapter theo story
    @GetMapping("/stories/{storyId}/volumes")
    public java.util.List<VolumeSummaryResponse> getVolumes(@PathVariable Long storyId) {
        return volumeService.listVolumesWithChapters(storyId);
    }

    @PostMapping(value = "/stories/{storyId}/volumes", consumes = MediaType.APPLICATION_JSON_VALUE)
    public CreateVolumeResponse createVolume(
            @PathVariable("storyId") Integer storyId,
            @RequestBody CreateVolumeRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = userPrincipal.getUser();
        return volumeService.createVolume(currentUser, storyId, req);
    }

    /**
     * Endpoint: Tạo chapter mới trong volume
     * POST /api/stories/{storyId}/volumes/{volumeId}/chapters
     * - Body: CreateChapterRequest { title, sequenceIndex, isFree, priceCoin, content, status }
     * - Hành vi: create chapter row, split content thành segments và lưu vào chapter_segments.
     */
    @PostMapping(value = "/stories/{storyId}/volumes/{volumeId}/chapters", consumes = MediaType.APPLICATION_JSON_VALUE)
    public CreateChapterResponse createChapter(
            @PathVariable("storyId") Long storyId,
            @PathVariable("volumeId") Long volumeId,
            @RequestBody CreateChapterRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = userPrincipal.getUser();
        return chapterService.createChapterFromHtml( currentUser,  storyId,  volumeId, req);
    }

    @GetMapping("/stories/{storyId}/chapters/{chapterId}/content")
    public Map<String, Object> getChapterContent(
            @PathVariable Long storyId,
            @PathVariable Long chapterId
    ) {
        return chapterService.getChapterContent(chapterId);
    }

}
