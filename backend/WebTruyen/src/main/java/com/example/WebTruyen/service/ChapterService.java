package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.ChapterResponse;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;

import java.util.List;

public interface ChapterService {
    //ChapterResponse createChapter(ChapterRequest request, Long authorId);
    //ChapterResponse updateChapter(Long chapterId, ChapterRequest request, Long authorId);
    List<ChapterResponse> getChaptersByStory(Long storyId, Long authorId);
    ChapterResponse getChapter(Long chapterId, Long authorId);
    void deleteChapter(Long chapterId, Long authorId);
    ChapterResponse publishChapterNow(Long chapterId, Long authorId);
    ChapterEntity getChapterById(Long chapterId);
}
