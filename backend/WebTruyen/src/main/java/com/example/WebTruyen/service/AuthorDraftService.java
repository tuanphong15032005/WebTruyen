package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.AuthorDraftChapterResponse;
import com.example.WebTruyen.dto.response.AuthorDraftOverviewResponse;
import com.example.WebTruyen.dto.response.AuthorDraftStoryResponse;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.Content.VolumeEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.StoryRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthorDraftService {

    // Minhdq - 26/02/2026
    // [Add author-draft-service-for-story-chapter - V1 - branch: clone-minhfinal2]
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;

    @Transactional
    public AuthorDraftOverviewResponse getDraftOverview(UserEntity author) {
        Long authorId = requireAuthorId(author);

        List<StoryEntity> draftStories = storyRepository
                .findByAuthor_IdAndStatusOrderByCreatedAtDesc(authorId, StoryStatus.draft);
        List<AuthorDraftStoryResponse> storyDtos = draftStories.stream()
                .map(this::toDraftStory)
                .toList();

        List<ChapterEntity> draftChapters = chapterRepository
                .findByAuthorIdAndStatus(authorId, ChapterStatus.draft);
        List<AuthorDraftChapterResponse> chapterDtos = draftChapters.stream()
                .map(this::toDraftChapter)
                .toList();

        return new AuthorDraftOverviewResponse(storyDtos, chapterDtos);
    }

    @Transactional
    public void deleteDraftStory(UserEntity author, Long storyId) {
        Long authorId = requireAuthorId(author);
        if (storyId == null || storyId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid story id");
        }
        int rawId;
        try {
            rawId = Math.toIntExact(storyId);
        } catch (ArithmeticException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid story id");
        }
        StoryEntity story = storyRepository.findByIdAndAuthorId(rawId, authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));

        if (story.getStatus() != StoryStatus.draft) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft stories can be deleted");
        }

        // Soft delete: chuyển sang archived để tránh vướng FK.
        story.setStatus(StoryStatus.archived);
        story.setTitle("[Đã xóa nháp] " + story.getTitle());
        storyRepository.save(story);
    }

    @Transactional
    public void deleteDraftChapter(UserEntity author, Long chapterId) {
        Long authorId = requireAuthorId(author);
        if (chapterId == null || chapterId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid chapter id");
        }

        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));

        if (chapter.getVolume() == null
                || chapter.getVolume().getStory() == null
                || chapter.getVolume().getStory().getAuthor() == null
                || !authorId.equals(chapter.getVolume().getStory().getAuthor().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not owner");
        }

        if (chapter.getStatus() != ChapterStatus.draft) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft chapters can be deleted");
        }

        chapterRepository.delete(chapter);
    }

    private Long requireAuthorId(UserEntity author) {
        if (author == null || author.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return author.getId();
    }

    private AuthorDraftStoryResponse toDraftStory(StoryEntity story) {
        LocalDateTime lastUpdatedAt = story.getCreatedAt();
        return new AuthorDraftStoryResponse(
                story.getId(),
                story.getTitle(),
                lastUpdatedAt
        );
    }

    private AuthorDraftChapterResponse toDraftChapter(ChapterEntity chapter) {
        StoryEntity story = chapter.getVolume() != null ? chapter.getVolume().getStory() : null;
        VolumeEntity volume = chapter.getVolume();
        return new AuthorDraftChapterResponse(
                chapter.getId(),
                story != null ? story.getId() : null,
                story != null ? story.getTitle() : null,
                volume != null ? volume.getId() : null,
                volume != null ? volume.getTitle() : null,
                chapter.getTitle(),
                chapter.getLastUpdateAt()
        );
    }
}

