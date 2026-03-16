package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.ReadingHistoryResponse;
import com.example.WebTruyen.dto.response.ReadingHistoryDetailResponse;
import com.example.WebTruyen.entity.keys.ReadingHistoryId;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.ChapterSegmentEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.ReadingHistoryEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ChapterSegmentRepository;
import com.example.WebTruyen.repository.ReadingHistoryRepository;
import com.example.WebTruyen.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReadingHistoryService {

    private final ReadingHistoryRepository readingHistoryRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterSegmentRepository chapterSegmentRepository;

    @Transactional(readOnly = true)
    public Optional<StoryEntity> getMostRecentStory(Long userId) {
        List<ReadingHistoryEntity> histories = readingHistoryRepository.findByUserIdOrderByStoryIdDesc(userId);
        return histories.isEmpty() ? Optional.empty() : Optional.of(histories.get(0).getStory());
    }

    @Transactional(readOnly = true)
    public ReadingHistoryResponse getReadingHistory(Long userId, int page, int size) {
        List<ReadingHistoryEntity> allHistories = readingHistoryRepository.findByUserIdOrderByStoryIdDesc(userId);
        
        // Get most recent story to exclude it from the list
        Optional<StoryEntity> mostRecentStory = allHistories.isEmpty() ? 
            Optional.empty() : Optional.of(allHistories.get(0).getStory());
        
        // Exclude most recent story from the list
        List<ReadingHistoryEntity> filteredHistories = mostRecentStory.isPresent() ? 
            allHistories.stream()
                .filter(history -> !history.getStory().getId().equals(mostRecentStory.get().getId()))
                .toList() : allHistories;
        
        // Simple pagination
        int start = page * size;
        int end = Math.min(start + size, filteredHistories.size());
        List<ReadingHistoryEntity> pageHistories = start < filteredHistories.size() ? 
            filteredHistories.subList(start, end) : List.of();
        
        Page<ReadingHistoryEntity> historyPage = new PageImpl<>(pageHistories, PageRequest.of(page, size), filteredHistories.size());
        
        List<ReadingHistoryDetailResponse> histories = historyPage.getContent()
                .stream()
                .map(this::toDetailResponse)
                .toList();

        return new ReadingHistoryResponse(
                mostRecentStory.map(story -> toStoryResponse(story, userId)).orElse(null),
                histories,
                historyPage.getTotalElements(),
                historyPage.getTotalPages(),
                historyPage.getNumber()
        );
    }

    @Transactional
    public void updateReadingProgress(Long userId, Long storyId, Long chapterId, Long segmentId) {
        StoryEntity story = storyRepository.findById(Long.valueOf(storyId).intValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
        
        ChapterEntity chapter = null;
        if (chapterId != null) {
            chapter = chapterRepository.findById(chapterId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        }
        
        ChapterSegmentEntity segment = null;
        if (segmentId != null) {
            segment = chapterSegmentRepository.findById(segmentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Segment not found"));
        }

        Optional<ReadingHistoryEntity> existingHistory = readingHistoryRepository.findByUserIdAndStoryId(userId, Long.valueOf(storyId));
        
        if (existingHistory.isPresent()) {
            ReadingHistoryEntity history = existingHistory.get();
            history.setLastChapter(chapter);
            history.setLastSegment(segment);
            readingHistoryRepository.save(history);
        } else {
            UserEntity user = new UserEntity();
            user.setId(userId);
            
            ReadingHistoryId historyId = new ReadingHistoryId(userId, Long.valueOf(storyId));
            ReadingHistoryEntity newHistory = ReadingHistoryEntity.builder()
                    .id(historyId)
                    .user(user)
                    .story(story)
                    .lastChapter(chapter)
                    .lastSegment(segment)
                    .build();
            readingHistoryRepository.save(newHistory);
        }
    }

    @Transactional
    public void deleteHistory(Long userId, Long storyId) {
        readingHistoryRepository.deleteByUserIdAndStoryId(userId, Long.valueOf(storyId));
    }

    @Transactional
    public void clearHistory(Long userId) {
        readingHistoryRepository.deleteByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDebugInfo(Long userId, Long storyId) {
        Map<String, Object> debug = new HashMap<>();
        
        // Lấy tất cả reading history của user
        List<ReadingHistoryEntity> allHistory = readingHistoryRepository.findByUserId(userId);
        debug.put("allHistoryCount", allHistory.size());
        debug.put("allHistory", allHistory.stream()
            .map(h -> Map.of(
                "storyId", h.getId().getStoryId(),
                "storyTitle", h.getStory().getTitle(),
                "lastChapterId", h.getLastChapter() != null ? h.getLastChapter().getId() : null,
                "lastChapterTitle", h.getLastChapter() != null ? h.getLastChapter().getTitle() : null
            ))
            .toList());
        
        // Lấy số chapter đã đọc cho story này
        long chaptersRead = readingHistoryRepository.countDistinctChaptersByUserIdAndStoryId(userId, storyId);
        debug.put("chaptersReadForStory", chaptersRead);
        
        // Lấy tổng số chapter của story
        long totalChapters = readingHistoryRepository.countTotalChaptersByStoryId(storyId);
        debug.put("totalChaptersForStory", totalChapters);
        
        // Lấy thông tin story
        StoryEntity story = storyRepository.findById(storyId.intValue()).orElse(null);
        if (story != null) {
            debug.put("storyInfo", Map.of(
                "id", story.getId(),
                "title", story.getTitle(),
                "coverUrl", story.getCoverUrl()
            ));
        }
        
        return debug;
    }
    
    @Transactional(readOnly = true)
    public Optional<ReadingHistoryDetailResponse> getContinueReading(Long userId, Long storyId) {
        Optional<ReadingHistoryEntity> history = readingHistoryRepository.findByUserIdAndStoryId(userId, Long.valueOf(storyId));
        return history.map(this::toDetailResponse);
    }
    
    @Transactional(readOnly = true)
    public Optional<ReadingHistoryDetailResponse> getRereadInfo(Long storyId) {
        StoryEntity story = storyRepository.findById(Long.valueOf(storyId).intValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
        
        Optional<ChapterEntity> firstChapter = chapterRepository.findFirstChapterOfStory(storyId);
        
        if (firstChapter.isPresent()) {
            return Optional.of(new ReadingHistoryDetailResponse(
                    null,
                    story.getId(),
                    story.getTitle(),
                    story.getCoverUrl(),
                    firstChapter.get().getId(),
                    firstChapter.get().getTitle(),
                    null,
                    LocalDateTime.now(),
                    0,
                    (int) readingHistoryRepository.countTotalChaptersByStoryId(storyId),
                    0.0
            ));
        }
        
        return Optional.empty();
    }

    private ReadingHistoryDetailResponse toDetailResponse(ReadingHistoryEntity history) {
        Long userId = history.getId().getUserId();
        Long storyId = history.getId().getStoryId();
        
        // Lấy số chapter đã đọc cho story này
        long chaptersRead = readingHistoryRepository.countDistinctChaptersByUserIdAndStoryId(userId, storyId);
        
        // Lấy tổng số chapter của story
        long totalChapters = readingHistoryRepository.countTotalChaptersByStoryId(storyId);
        
        // Tính phần trăm progress
        double progressPercentage = totalChapters > 0 ? (double) chaptersRead / totalChapters * 100 : 0.0;
        
        // Xử lý cover: trả về ảnh mặc định nếu không có ảnh bìa
        String coverUrl = history.getStory().getCoverUrl();
        if (coverUrl == null || coverUrl.trim().isEmpty()) {
            coverUrl = "/images/no-cover-placeholder.jpg"; // Ảnh xám với chữ NO COVER
        }
        
        return new ReadingHistoryDetailResponse(
                null, // Composite key doesn't have getId()
                history.getId().getStoryId(), // Use storyId from composite key (Long)
                history.getStory().getTitle(),
                coverUrl, // Ảnh mặc định nếu null
                history.getLastChapter() != null ? history.getLastChapter().getId() : null, // Chapter ID is Long
                history.getLastChapter() != null ? history.getLastChapter().getTitle() : null,
                history.getLastSegment() != null ? history.getLastSegment().getId() : null, // Segment ID is Long
                LocalDateTime.now(), // Use current time as fallback since table doesn't have last_read_at
                (int) chaptersRead,
                (int) totalChapters,
                progressPercentage
        );
    }

    private ReadingHistoryDetailResponse toStoryResponse(StoryEntity story, Long userId) {
        // Lấy tổng số chapter của story
        long totalChapters = readingHistoryRepository.countTotalChaptersByStoryId(story.getId());
        
        // Lấy số chapter đã đọc cho story này
        long chaptersRead = readingHistoryRepository.countDistinctChaptersByUserIdAndStoryId(userId, story.getId());
        
        // Tính phần trăm progress
        double progressPercentage = totalChapters > 0 ? (double) chaptersRead / totalChapters * 100 : 0.0;
        
        // Xử lý cover: trả về ảnh mặc định nếu không có ảnh bìa
        String coverUrl = story.getCoverUrl();
        if (coverUrl == null || coverUrl.trim().isEmpty()) {
            coverUrl = "/images/no-cover-placeholder.jpg"; // Ảnh xám với chữ NO COVER
        }
        
        return new ReadingHistoryDetailResponse(
                null,
                story.getId(), // Use Long directly
                story.getTitle(),
                coverUrl, // Ảnh mặc định nếu null
                null,
                null,
                null,
                null,
                (int) chaptersRead,
                (int) totalChapters,
                progressPercentage
        );
    }
}
