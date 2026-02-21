package com.example.WebTruyen.service.impl;

import com.example.WebTruyen.dto.response.ChapterDetailResponse;
import com.example.WebTruyen.dto.response.ChapterResponse;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.ChapterSegmentEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ChapterSegmentRepository;
import com.example.WebTruyen.service.ChapterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ChapterServiceImpl implements ChapterService {

    private final ChapterRepository chapterRepository;
    private final ChapterSegmentRepository chapterSegmentRepository;

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
        return chapterRepository.findById(chapterId).orElse(null);
    }

    // Chapter Reader Page methods
    @Override
    public ChapterDetailResponse getChapterDetail(Long chapterId) {
        log.info("Getting chapter detail for chapter ID: {}", chapterId);
        
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new RuntimeException("Chapter not found with ID: " + chapterId));

        List<ChapterSegmentEntity> segments = chapterSegmentRepository.findByChapterIdOrderBySeq(chapterId);
        
        Long nextChapterId = findNextChapterId(chapter);
        Long previousChapterId = findPreviousChapterId(chapter);

        List<ChapterDetailResponse.ChapterSegmentResponse> segmentResponses = segments.stream()
                .map(segment -> ChapterDetailResponse.ChapterSegmentResponse.builder()
                        .id(segment.getId())
                        .seq(segment.getSeq())
                        .segmentText(segment.getSegmentText())
                        .build())
                .collect(Collectors.toList());

        return ChapterDetailResponse.builder()
                .id(chapter.getId())
                .storyId(chapter.getVolume().getStory().getId())
                .volumeId(chapter.getVolume().getId())
                .title(chapter.getTitle())
                .free(chapter.isFree())
                .priceCoin(chapter.getPriceCoin())
                .status(chapter.getStatus())
                .sequenceIndex(chapter.getSequenceIndex())
                .segments(segmentResponses)
                .nextChapterId(nextChapterId)
                .previousChapterId(previousChapterId)
                .createdAt(chapter.getCreatedAt())
                .lastUpdateAt(chapter.getLastUpdateAt())
                .build();
    }

    @Override
    public Long getNextChapterId(Long chapterId) {
        log.info("Getting next chapter ID for chapter ID: {}", chapterId);
        
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new RuntimeException("Chapter not found with ID: " + chapterId));
        
        return findNextChapterId(chapter);
    }

    @Override
    public Long getPreviousChapterId(Long chapterId) {
        log.info("Getting previous chapter ID for chapter ID: {}", chapterId);
        
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new RuntimeException("Chapter not found with ID: " + chapterId));
        
        return findPreviousChapterId(chapter);
    }

    private Long findNextChapterId(ChapterEntity chapter) {
        List<ChapterEntity> nextChapters = chapterRepository.findNextChapters(
                chapter.getVolume().getId(), 
                chapter.getSequenceIndex()
        );
        
        return nextChapters.isEmpty() ? null : nextChapters.get(0).getId();
    }

    private Long findPreviousChapterId(ChapterEntity chapter) {
        List<ChapterEntity> previousChapters = chapterRepository.findPreviousChapters(
                chapter.getVolume().getId(), 
                chapter.getSequenceIndex()
        );
        
        return previousChapters.isEmpty() ? null : previousChapters.get(0).getId();
    }
}
