package com.example.WebTruyen.service.impl;


import com.example.WebTruyen.dto.response.ChapterResponse;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.service.ChapterService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service // QUAN TRỌNG: Phải có dòng này thì lỗi mới hết
public class ChapterServiceImpl implements ChapterService {

    @Override
    public List<ChapterResponse> getChaptersByStory(Long storyId, Long authorId) {
        // Tạm thời để return null hoặc empty để test app
        return List.of();
    }

    @Override
    public ChapterResponse getChapter(Long chapterId, Long authorId) {
        return null;
    }

    @Override
    public void deleteChapter(Long chapterId, Long authorId) {
    }

    @Override
    public ChapterResponse publishChapterNow(Long chapterId, Long authorId) {
        return null;
    }

    @Override
    public ChapterEntity getChapterById(Long chapterId) {
        // Viết logic tìm chapter ở đây (ví dụ dùng ChapterRepository)
        return null;
    }
}
