package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateChapterRequest;
import com.example.WebTruyen.dto.response.ChapterDetailResponse;
import com.example.WebTruyen.dto.response.ChapterResponse;
import com.example.WebTruyen.dto.response.CreateChapterResponse;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;

import java.util.List;
import java.util.Map;

public interface ChapterService {

    // ===== Author Management Methods (HEAD) =====
    List<ChapterResponse> getChaptersByStory(Long storyId, Long authorId);
    ChapterResponse getChapter(Long chapterId, Long authorId);
    void deleteChapter(Long chapterId, Long authorId);
    ChapterResponse publishChapterNow(Long chapterId, Long authorId);
    ChapterEntity getChapterById(Long chapterId);

    // ===== Author Create/Update HTML =====
    CreateChapterResponse createChapterFromHtml(
            UserEntity currentUser,
            Long storyId,
            Long volumeId,
            CreateChapterRequest req
    );

    CreateChapterResponse updateChapterFromHtml(
            UserEntity currentUser,
            Long storyId,
            Long volumeId,
            Long chapterId,
            CreateChapterRequest req
    );

    Map<String, Object> getChapterContent(Long chapterId);

    // ===== Chapter Reader Page (ChapterPage branch) =====
    ChapterDetailResponse getChapterDetail(Long chapterId, Long userId);
    Long getNextChapterId(Long chapterId);
    Long getPreviousChapterId(Long chapterId);
}