package com.example.WebTruyen.controller;


import com.example.WebTruyen.dto.request.CreateChapterRequest;
import com.example.WebTruyen.dto.request.CreateCommentRequest;
import com.example.WebTruyen.dto.request.CreateStoryRequest;
import com.example.WebTruyen.dto.request.CreateVolumeRequest;
import com.example.WebTruyen.dto.request.UpsertStoryReviewRequest;
import com.example.WebTruyen.dto.response.CommentResponse;
import com.example.WebTruyen.dto.response.CreateChapterResponse;
import com.example.WebTruyen.dto.response.CreateVolumeResponse;
import com.example.WebTruyen.dto.response.HomeCommunityCommentResponse;
import com.example.WebTruyen.dto.response.PagedResponse;
import com.example.WebTruyen.dto.response.StoryReviewResponse;
import com.example.WebTruyen.dto.response.StoryResponse;
import com.example.WebTruyen.dto.response.StorySidebarResponse;
import com.example.WebTruyen.dto.response.VolumeSummaryResponse;
import com.example.WebTruyen.dto.response.AuthorChapterOptionResponse;
import com.example.WebTruyen.dto.response.AuthorCommentResponse;
import com.example.WebTruyen.dto.response.AuthorStoryOptionResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.ChapterService;
import com.example.WebTruyen.service.CommentService;
import com.example.WebTruyen.service.StoryReviewService;
import com.example.WebTruyen.service.StoryService;
import com.example.WebTruyen.service.VolumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.List;
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

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
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

    // Muc dich: Endpoint tra du lieu sidebar cho trang story metadata reader. Hieuson + 10h30
    @GetMapping("/public/stories/{storyId}/sidebar")
    public StorySidebarResponse getPublicStorySidebar(@PathVariable Integer storyId) {
        return storyService.getPublicStorySidebar(storyId);
    }

    @GetMapping("/public/stories")
    public java.util.List<StoryResponse> getPublicStories(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(defaultValue = "lastUpdatedAt,desc") String sort
    ) {
        return storyService.getPublishedStories(page, size, sort);
    }

    // Hieuson - 24/2 + Tra ve danh sach phan hoi cong dong moi nhat cho HomePage.
    @GetMapping("/public/comments/latest")
    public List<HomeCommunityCommentResponse> getLatestPublicComments(
            @RequestParam(defaultValue = "3") Integer size
    ) {
        return commentService.listLatestPublicComments(size);
    }

    @GetMapping("/stories/my")
    public java.util.List<StoryResponse> getMyStories(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return storyService.getStoriesByAuthor(currentUser);
    }

    @GetMapping("/stories/library")
    public java.util.List<StoryResponse> getLibraryStories(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return storyService.getLibraryStories(currentUser);
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
        boolean saved = storyService.toggleLibraryStatus(currentUser, storyId);
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
            @RequestBody CreateCommentRequest req,
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
        return Map.of("deleted", true);
    }

    @PostMapping(value = "/stories/{storyId}/comments/{commentId}/report", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Boolean> reportStoryComment(
            @PathVariable Integer storyId,
            @PathVariable Long commentId,
            @RequestBody(required = false) Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        String reason = payload != null ? payload.getOrDefault("reason", "") : "";
        commentService.reportStoryComment(currentUser, storyId, commentId, reason);
        return Map.of("reported", true);
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
    //phong sua conflict merge muatruyen voi admin1
//<<<<<<< HEAD
    @PutMapping(value = "/stories/{storyId}/chapters/{chapterId}/comments/{commentId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public CommentResponse updateChapterComment(
            @PathVariable Integer storyId,
            @PathVariable Long chapterId,
            @PathVariable Long commentId,
            @RequestBody CreateCommentRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return commentService.updateChapterComment(currentUser, storyId, chapterId, commentId, req);
    }

    @DeleteMapping("/stories/{storyId}/chapters/{chapterId}/comments/{commentId}")
    public Map<String, Boolean> deleteChapterComment(
            @PathVariable Integer storyId,
            @PathVariable Long chapterId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
                commentService.deleteChapterComment(currentUser, storyId, chapterId, commentId);
        return Map.of("deleted", true);
    }

//=======
    @GetMapping("/author/comments/stories")
    public List<AuthorStoryOptionResponse> getAuthorCommentStories(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return commentService.listAuthorStories(currentUser.getId());
    }

    @GetMapping("/author/comments/stories/{storyId}/chapters")
    public List<AuthorChapterOptionResponse> getAuthorCommentChapters(
            @PathVariable Integer storyId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return commentService.listAuthorChapters(currentUser.getId(), storyId);
    }

    @GetMapping("/author/comments")
    public List<AuthorCommentResponse> getAuthorComments(
            @RequestParam Integer storyId,
            @RequestParam(required = false) Long chapterId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return commentService.listAuthorComments(currentUser.getId(), storyId, chapterId);
    }

    @PostMapping(value = "/author/comments/{parentCommentId}/reply", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AuthorCommentResponse replyAuthorComment(
            @PathVariable Long parentCommentId,
            @RequestBody AuthorReplyRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return commentService.replyAsAuthor(currentUser, parentCommentId, req.content());
    }

//    @PostMapping("/author/comments/{commentId}/hide")
//    public Map<String, String> hideAuthorComment(
////>>>>>>> origin/minhfinal1
//            //phong sua conflict merge muatruyen voi admin1
//            @PathVariable Long commentId,
//            @AuthenticationPrincipal UserPrincipal userPrincipal
//    ) {
//        UserEntity currentUser = requireUser(userPrincipal);
//        //phong sua conflict merge muatruyen voi admin1
////<<<<<<< HEAD
//        commentService.deleteChapterComment(currentUser, storyId, chapterId, commentId);
//        return Map.of("deleted", true);
//    }

    @PostMapping(value = "/stories/{storyId}/chapters/{chapterId}/comments/{commentId}/report", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Boolean> reportChapterComment(
            @PathVariable Integer storyId,
            @PathVariable Long chapterId,
            @PathVariable Long commentId,
            @RequestBody(required = false) Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        String reason = payload != null ? payload.getOrDefault("reason", "") : "";
        commentService.reportChapterComment(currentUser, storyId, chapterId, commentId, reason);
        return Map.of("reported", true);
//=======
//        commentService.hideAuthorComment(currentUser.getId(), commentId);
//        return Map.of("message", "Comment hidden");
    }
    @PostMapping("/author/comments/{commentId}/hide")
    public Map<String, String> hideAuthorComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        commentService.hideAuthorComment(currentUser.getId(), commentId);
        return Map.of("message", "Comment hidden");
    }

    @PostMapping("/author/comments/{commentId}/unhide")
    public Map<String, String> unhideAuthorComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        commentService.unhideAuthorComment(currentUser.getId(), commentId);
        return Map.of("message", "Comment unhidden");
    }

    @DeleteMapping("/author/comments/{commentId}")
    public Map<String, String> deleteAuthorComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        commentService.deleteAuthorComment(currentUser.getId(), commentId);
        return Map.of("message", "Comment deleted");
//>>>>>>> origin/minhfinal1
        //phong sua conflict merge muatruyen voi admin1
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

    public record AuthorReplyRequest(String content) {}
}
