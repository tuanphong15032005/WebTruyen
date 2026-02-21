package com.example.WebTruyen.controller;


import com.example.WebTruyen.dto.request.CreateChapterRequest;
import com.example.WebTruyen.dto.request.CreateCommentRequest;
import com.example.WebTruyen.dto.request.CreateStoryRequest;
import com.example.WebTruyen.dto.request.CreateVolumeRequest;
import com.example.WebTruyen.dto.request.ReportCommentRequest;
import com.example.WebTruyen.dto.request.SaveChapterDraftRequest;
import com.example.WebTruyen.dto.request.UpdateCommentRequest;
import com.example.WebTruyen.dto.request.UpsertStoryReviewRequest;
import com.example.WebTruyen.dto.respone.CommentResponse;
import com.example.WebTruyen.dto.respone.CreateChapterResponse;
import com.example.WebTruyen.dto.respone.CreateVolumeResponse;
import com.example.WebTruyen.dto.respone.PagedResponse;
import com.example.WebTruyen.dto.respone.StoryReviewResponse;
import com.example.WebTruyen.dto.respone.StoryResponse;
import com.example.WebTruyen.dto.respone.VolumeSummaryResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.security.JwtTokenProvider;
import com.example.WebTruyen.service.ChapterService;
import com.example.WebTruyen.service.CommentService;
import com.example.WebTruyen.service.StoryReviewService;
import com.example.WebTruyen.service.StoryService;
import com.example.WebTruyen.service.VolumeService;
import com.example.WebTruyen.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;
    private final VolumeService volumeService;
    private final ChapterService chapterService;
    private final StoryReviewService storyReviewService;
    private final CommentService commentService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }

    private UserEntity requireUserByToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        String token = rawToken.startsWith("Bearer ") ? rawToken.substring(7) : rawToken;
        if (!jwtTokenProvider.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));
    }

    @PostMapping(value = "/stories", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StoryResponse createStory(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "cover", required = false) MultipartFile cover,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) throws Exception {
        CreateStoryRequest data = new ObjectMapper().readValue(dataJson, CreateStoryRequest.class);
        UserEntity currentUser = requireUser(userPrincipal);
        return storyService.createStory(currentUser, data, cover);
    }

    // Lấy thông tin chi tiết truyện theo id
    @GetMapping("/stories/{storyId}")
    public StoryResponse getStory(@PathVariable Integer storyId) {
        return storyService.getStoryById(storyId);
    }

    @GetMapping("/public/stories/{storyId}")
    public StoryResponse getPublicStory(@PathVariable Integer storyId) {
        return storyService.getPublishedStoryById(storyId);
    }

    @GetMapping("/stories/{storyId}/notify-status")
    public Map<String, Boolean> getNotifyStatus(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = userPrincipal != null ? userPrincipal.getUser() : null;
        boolean enabled = storyService.getNotifyNewChapterStatus(currentUser, storyId);
        return Map.of("enabled", enabled);
    }

    @PostMapping("/stories/{storyId}/notify-status/toggle")
    public Map<String, Boolean> toggleNotifyStatus(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        boolean enabled = storyService.toggleNotifyNewChapter(currentUser, storyId);
        return Map.of("enabled", enabled);
    }

    @GetMapping("/stories/{storyId}/library-status")
    public Map<String, Boolean> getLibraryStatus(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = userPrincipal != null ? userPrincipal.getUser() : null;
        boolean saved = storyService.getLibraryStatus(currentUser, storyId);
        return Map.of("saved", saved);
    }

    @PostMapping("/stories/{storyId}/library/toggle")
    public Map<String, Boolean> toggleLibraryStatus(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        boolean saved = storyService.toggleLibraryEntry(currentUser, storyId);
        return Map.of("saved", saved);
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
        UserEntity currentUser = requireUser(userPrincipal);
        return storyService.updateStory(currentUser, storyId, data, cover);
    }

    // L?y danh s?ch volume v? chapter theo story
    @GetMapping("/stories/{storyId}/volumes")
    public java.util.List<VolumeSummaryResponse> getVolumes(@PathVariable Long storyId) {
        return volumeService.listVolumesWithChapters(storyId);
    }

    @GetMapping("/public/stories/{storyId}/volumes")
    public java.util.List<VolumeSummaryResponse> getPublicVolumes(@PathVariable Long storyId) {
        return volumeService.listPublishedVolumesWithPublishedChapters(storyId);
    }

    @GetMapping("/public/stories/{storyId}/reviews")
    public PagedResponse<StoryReviewResponse> getPublicStoryReviews(
            @PathVariable Integer storyId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "8") Integer size
    ) {
        return storyReviewService.listPublishedStoryReviews(storyId, page, size);
    }

    @PostMapping(value = "/stories/{storyId}/reviews", consumes = MediaType.APPLICATION_JSON_VALUE)
    public StoryReviewResponse upsertStoryReview(
            @PathVariable Integer storyId,
            @RequestBody UpsertStoryReviewRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return storyReviewService.createReview(currentUser, storyId, req);
    }

    @GetMapping("/public/stories/{storyId}/comments")
    public PagedResponse<CommentResponse> getPublicStoryComments(
            @PathVariable Integer storyId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "8") Integer size
    ) {
        return commentService.listPublishedStoryComments(storyId, page, size);
    }

    @PostMapping(value = "/stories/{storyId}/comments", consumes = MediaType.APPLICATION_JSON_VALUE)
    public CommentResponse createStoryComment(
            @PathVariable Integer storyId,
            @RequestBody CreateCommentRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return commentService.createStoryComment(currentUser, storyId, req);
    }

    @PutMapping(value = "/stories/{storyId}/comments/{commentId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public CommentResponse updateStoryComment(
            @PathVariable Integer storyId,
            @PathVariable Long commentId,
            @RequestBody UpdateCommentRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return commentService.updateStoryComment(currentUser, storyId, commentId, req);
    }
    @DeleteMapping("/stories/{storyId}/comments/{commentId}")
    public Map<String, Boolean> deleteStoryComment(
            @PathVariable Integer storyId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        commentService.deleteStoryComment(currentUser, storyId, commentId);
        return Map.of("success", true);
    }

    @PostMapping(value = "/stories/{storyId}/comments/{commentId}/report", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Boolean> reportStoryComment(
            @PathVariable Integer storyId,
            @PathVariable Long commentId,
            @RequestBody ReportCommentRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        commentService.reportStoryComment(currentUser, storyId, commentId, req);
        return Map.of("success", true);
    }

    @GetMapping("/public/stories/{storyId}/chapters/{chapterId}/comments")
    public PagedResponse<CommentResponse> getPublicChapterComments(
            @PathVariable Integer storyId,
            @PathVariable Long chapterId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "8") Integer size
    ) {
        return commentService.listPublishedChapterComments(storyId, chapterId, page, size);
    }

    @PostMapping(value = "/stories/{storyId}/chapters/{chapterId}/comments", consumes = MediaType.APPLICATION_JSON_VALUE)
    public CommentResponse createChapterComment(
            @PathVariable Integer storyId,
            @PathVariable Long chapterId,
            @RequestBody CreateCommentRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return commentService.createChapterComment(currentUser, storyId, chapterId, req);
    }

    @PostMapping(value = "/stories/{storyId}/volumes", consumes = MediaType.APPLICATION_JSON_VALUE)
    public CreateVolumeResponse createVolume(
            @PathVariable("storyId") Integer storyId,
            @RequestBody CreateVolumeRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
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
        UserEntity currentUser = requireUser(userPrincipal);
        return chapterService.createChapterFromHtml( currentUser,  storyId,  volumeId, req);
    }

    @PutMapping(value = "/stories/{storyId}/volumes/{volumeId}/chapters/{chapterId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public CreateChapterResponse updateChapter(
            @PathVariable("storyId") Long storyId,
            @PathVariable("volumeId") Long volumeId,
            @PathVariable("chapterId") Long chapterId,
            @RequestBody CreateChapterRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return chapterService.updateChapterFromHtml(currentUser, storyId, volumeId, chapterId, req);
    }

    @GetMapping("/stories/{storyId}/chapters/{chapterId}/content")
    public Map<String, Object> getChapterContent(
            @PathVariable Long storyId,
            @PathVariable Long chapterId
    ) {
        return chapterService.getChapterContent(chapterId);
    }

    @GetMapping("/stories/{storyId}/volumes/{volumeId}/chapters/{chapterId}/draft")
    public Map<String, Object> getChapterDraft(
            @PathVariable("storyId") Long storyId,
            @PathVariable("volumeId") Long volumeId,
            @PathVariable("chapterId") Long chapterId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return chapterService.getChapterDraft(currentUser, storyId, volumeId, chapterId);
    }

    @PutMapping(value = "/stories/{storyId}/volumes/{volumeId}/chapters/{chapterId}/draft", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> upsertChapterDraft(
            @PathVariable("storyId") Long storyId,
            @PathVariable("volumeId") Long volumeId,
            @PathVariable("chapterId") Long chapterId,
            @RequestBody SaveChapterDraftRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return chapterService.upsertChapterDraft(currentUser, storyId, volumeId, chapterId, req);
    }

    @PostMapping(value = "/stories/{storyId}/volumes/{volumeId}/chapters/{chapterId}/draft/beacon", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.TEXT_PLAIN_VALUE})
    public Map<String, Object> upsertChapterDraftByBeacon(
            @PathVariable("storyId") Long storyId,
            @PathVariable("volumeId") Long volumeId,
            @PathVariable("chapterId") Long chapterId,
            @RequestParam("token") String token,
            @RequestBody SaveChapterDraftRequest req
    ) {
        UserEntity currentUser = requireUserByToken(token);
        return chapterService.upsertChapterDraft(currentUser, storyId, volumeId, chapterId, req);
    }

    @DeleteMapping("/stories/{storyId}/volumes/{volumeId}/chapters/{chapterId}/draft")
    public Map<String, Boolean> deleteChapterDraft(
            @PathVariable("storyId") Long storyId,
            @PathVariable("volumeId") Long volumeId,
            @PathVariable("chapterId") Long chapterId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        chapterService.deleteChapterDraft(currentUser, storyId, volumeId, chapterId);
        return Map.of("success", true);
    }

}
