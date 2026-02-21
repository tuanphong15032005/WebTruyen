package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateStoryRequest;
import com.example.WebTruyen.dto.respone.StoryResponse;
import com.example.WebTruyen.dto.respone.TagDto;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.enums.StoryCompletionStatus;
import com.example.WebTruyen.entity.enums.StoryKind;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.keys.StoryTagId;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.Content.StoryTagEntity;
import com.example.WebTruyen.entity.model.Content.TagEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.FollowStoryEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.LibraryEntryEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ChapterSegmentRepository;
import com.example.WebTruyen.repository.FollowStoryRepository;
import com.example.WebTruyen.repository.LibraryEntryRepository;
import com.example.WebTruyen.repository.ReadingHistoryRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.StoryTagRepository;
import com.example.WebTruyen.repository.TagRepository;
import com.example.WebTruyen.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository storyRepository;
    private final TagRepository tagRepository;
    private final StoryTagRepository storyTagRepository;
    private final StorageService storageService;
    private final UserRepository userRepository;
    private final ReadingHistoryRepository readingHistoryRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterSegmentRepository chapterSegmentRepository;
    private final FollowStoryRepository followStoryRepository;
    private final LibraryEntryRepository libraryEntryRepository;

    @Transactional
    public StoryResponse createStory(UserEntity currentUser, CreateStoryRequest req, MultipartFile cover) {
        validateCreateStoryRequest(req);

        String coverUrl = null;
        if (cover != null && !cover.isEmpty()) {
            coverUrl = storageService.saveCover(cover);
        }

        StoryKind kind = parseKind(req.kind(), StoryKind.original);
        StoryCompletionStatus completionStatus = parseCompletionStatus(req.completionStatus(), StoryCompletionStatus.ongoing);
        String originalAuthorName = normalizeOriginalAuthorName(kind, req.originalAuthorName());
        UserEntity originalAuthorUser = kind == StoryKind.translated
                ? resolveOriginalAuthorUser(req.originalAuthorUserId())
                : null;

        StoryEntity story = StoryEntity.builder()
                .author(currentUser)
                .title(req.title().trim())
                .summary(req.summaryHtml())
                .coverUrl(coverUrl)
                .status(resolveStatus(req))
                .kind(kind)
                .originalAuthorName(originalAuthorName)
                .completionStatus(completionStatus)
                .completedAt(completionStatus == StoryCompletionStatus.completed ? LocalDateTime.now() : null)
                .originalAuthorUser(originalAuthorUser)
                .build();

        StoryEntity saved = storyRepository.save(story);
        List<TagDto> tagDtos = syncStoryTags(saved, normalizeIds(req.tagIds()), true);
        return toResponse(saved, tagDtos, false);
    }

    @Transactional
    public StoryResponse getStoryById(Integer storyId) {
        StoryEntity story = requireStoryById(storyId.longValue());

        List<TagDto> tagDtos = story.getStoryTags().stream()
                .map(StoryTagEntity::getTag)
                .filter(Objects::nonNull)
                .map(t -> new TagDto(t.getId(), t.getName(), t.getSlug()))
                .toList();

        return toResponse(story, tagDtos, false);
    }

    @Transactional
    public StoryResponse getPublishedStoryById(Integer storyId) {
        StoryEntity story = requirePublishedStoryById(storyId.longValue());

        List<TagDto> tagDtos = story.getStoryTags().stream()
                .map(StoryTagEntity::getTag)
                .filter(Objects::nonNull)
                .map(t -> new TagDto(t.getId(), t.getName(), t.getSlug()))
                .toList();

        return toResponse(story, tagDtos, true);
    }

    @Transactional
    public boolean getNotifyNewChapterStatus(UserEntity currentUser, Long storyId) {
        if (currentUser == null) {
            return false;
        }
        requireStoryById(storyId);
        return followStoryRepository.findByUser_IdAndStory_Id(currentUser.getId(), storyId)
                .map(FollowStoryEntity::isNotifyNewChapter)
                .orElse(false);
    }

    @Transactional
    public boolean toggleNotifyNewChapter(UserEntity currentUser, Long storyId) {
        StoryEntity story = requireStoryById(storyId);
        FollowStoryEntity follow = followStoryRepository.findByUser_IdAndStory_Id(currentUser.getId(), storyId)
                .orElseGet(() -> FollowStoryEntity.builder()
                        .user(currentUser)
                        .story(story)
                        .notifyNewChapter(true)
                        .createdAt(LocalDateTime.now())
                        .build());

        if (follow.getId() != null) {
            follow.setNotifyNewChapter(!follow.isNotifyNewChapter());
        }

        FollowStoryEntity saved = followStoryRepository.save(follow);
        return saved.isNotifyNewChapter();
    }

    @Transactional
    public boolean getLibraryStatus(UserEntity currentUser, Long storyId) {
        if (currentUser == null) {
            return false;
        }
        requirePublishedStoryById(storyId);
        return libraryEntryRepository.findByUser_IdAndStory_Id(currentUser.getId(), storyId).isPresent();
    }

    @Transactional
    public boolean toggleLibraryEntry(UserEntity currentUser, Long storyId) {
        StoryEntity story = requirePublishedStoryById(storyId);
        return libraryEntryRepository.findByUser_IdAndStory_Id(currentUser.getId(), storyId)
                .map(existing -> {
                    libraryEntryRepository.delete(existing);
                    return false;
                })
                .orElseGet(() -> {
                    LibraryEntryEntity entry = LibraryEntryEntity.builder()
                            .user(currentUser)
                            .story(story)
                            .addedAt(LocalDateTime.now())
                            .favorite(false)
                            .build();
                    libraryEntryRepository.save(entry);
                    return true;
                });
    }

    @Transactional
    public StoryResponse updateStory(UserEntity currentUser, Integer storyId, CreateStoryRequest req, MultipartFile cover) {
        StoryEntity story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));

        Long authorId = story.getAuthor() != null ? story.getAuthor().getId() : null;
        if (authorId == null || !authorId.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not the owner of this story");
        }

        if (req.title() != null && !req.title().isBlank()) {
            story.setTitle(req.title().trim());
        }
        if (req.summaryHtml() != null) {
            story.setSummary(req.summaryHtml());
        }
        story.setStatus(resolveStatus(req));

        StoryKind kind = parseKind(req.kind(), story.getKind() == null ? StoryKind.original : story.getKind());
        story.setKind(kind);
        story.setOriginalAuthorName(normalizeOriginalAuthorName(kind, req.originalAuthorName()));
        story.setOriginalAuthorUser(kind == StoryKind.translated
                ? resolveOriginalAuthorUser(req.originalAuthorUserId())
                : null);

        StoryCompletionStatus completionStatus = parseCompletionStatus(
                req.completionStatus(),
                story.getCompletionStatus() == null ? StoryCompletionStatus.ongoing : story.getCompletionStatus()
        );
        story.setCompletionStatus(completionStatus);
        if (completionStatus == StoryCompletionStatus.completed && story.getCompletedAt() == null) {
            story.setCompletedAt(LocalDateTime.now());
        }
        if (completionStatus != StoryCompletionStatus.completed) {
            story.setCompletedAt(null);
        }

        if (cover != null && !cover.isEmpty()) {
            story.setCoverUrl(storageService.saveCover(cover));
        }

        StoryEntity saved = storyRepository.save(story);
        List<TagDto> tagDtos = syncStoryTags(saved, normalizeIds(req.tagIds()), true);
        return toResponse(saved, tagDtos, false);
    }

    private void validateCreateStoryRequest(CreateStoryRequest req) {
        if (req.title() == null || req.title().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
    }

    private StoryResponse toResponse(StoryEntity story, List<TagDto> tags, boolean publishedOnly) {
        long readerCount = readingHistoryRepository.countByStory_Id(story.getId());
        long savedCount = libraryEntryRepository.countByStory_Id(story.getId());
        long wordCount = countStoryWords(story.getId(), publishedOnly);
        LocalDateTime lastUpdatedAt = chapterRepository.findLatestUpdateAtByStoryId(story.getId());
        BigDecimal ratingAvg = computeRatingAverage(story.getRatingSum(), story.getRatingCount());

        String authorPenName = story.getAuthor() != null ? story.getAuthor().getAuthorPenName() : null;
        String translatorPenName = story.getKind() == StoryKind.translated ? authorPenName : null;
        Long originalAuthorUserId = story.getOriginalAuthorUser() != null ? story.getOriginalAuthorUser().getId() : null;

        return new StoryResponse(
                story.getId(),
                story.getAuthor() != null ? story.getAuthor().getId() : null,
                authorPenName,
                translatorPenName,
                story.getTitle(),
                story.getSummary(),
                story.getCoverUrl(),
                story.getStatus() != null ? story.getStatus().name() : null,
                story.getKind() != null ? story.getKind().name() : null,
                story.getCompletionStatus() != null ? story.getCompletionStatus().name() : null,
                story.getCompletedAt(),
                story.getOriginalAuthorName(),
                originalAuthorUserId,
                story.getRatingSum(),
                story.getRatingCount(),
                ratingAvg,
                readerCount,
                savedCount,
                wordCount,
                lastUpdatedAt,
                tags,
                story.getCreatedAt()
        );
    }

    private BigDecimal computeRatingAverage(long ratingSum, int ratingCount) {
        if (ratingCount <= 0) {
            return null;
        }
        return BigDecimal.valueOf(ratingSum)
                .divide(BigDecimal.valueOf(ratingCount), 2, RoundingMode.HALF_UP);
    }

    private long countStoryWords(Long storyId, boolean publishedOnly) {
        long total = 0L;
        List<String> segments = publishedOnly
                ? chapterSegmentRepository.findSegmentTextsByStoryIdAndChapterStatus(storyId, ChapterStatus.published)
                : chapterSegmentRepository.findSegmentTextsByStoryId(storyId);
        for (String segment : segments) {
            total += countWordsFromHtml(segment);
        }
        return total;
    }

    private long countWordsFromHtml(String html) {
        if (html == null || html.isBlank()) {
            return 0L;
        }
        String plain = Jsoup.parse(html).text();
        if (plain == null || plain.isBlank()) {
            return 0L;
        }
        return plain.trim().split("\\s+").length;
    }

    private StoryStatus resolveStatus(CreateStoryRequest req) {
        String statusRaw = req.status();
        if (statusRaw != null && !statusRaw.isBlank()) {
            return StoryStatus.valueOf(statusRaw.trim().toLowerCase());
        }
        String visibility = req.visibility();
        if (visibility != null && !visibility.isBlank()) {
            String normalized = visibility.trim().toUpperCase();
            if ("PUBLIC".equals(normalized)) return StoryStatus.published;
            if ("DRAFT".equals(normalized)) return StoryStatus.draft;
        }
        return StoryStatus.draft;
    }

    private StoryKind parseKind(String kindRaw, StoryKind fallback) {
        if (kindRaw == null || kindRaw.isBlank()) {
            return fallback;
        }
        try {
            return StoryKind.valueOf(kindRaw.trim().toLowerCase());
        } catch (IllegalArgumentException ex) {
            return fallback;
        }
    }

    private StoryCompletionStatus parseCompletionStatus(String raw, StoryCompletionStatus fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback;
        }
        try {
            return StoryCompletionStatus.valueOf(raw.trim().toLowerCase());
        } catch (IllegalArgumentException ex) {
            return fallback;
        }
    }

    private String normalizeOriginalAuthorName(StoryKind kind, String name) {
        if (kind != StoryKind.translated) {
            return null;
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("originalAuthorName is required for translated story");
        }
        return name.trim();
    }

    private UserEntity resolveOriginalAuthorUser(Long originalAuthorUserId) {
        if (originalAuthorUserId == null) {
            return null;
        }
        return userRepository.findById(originalAuthorUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "originalAuthorUserId not found"));
    }

    private List<TagDto> syncStoryTags(StoryEntity story, List<Long> tagIds, boolean replaceExisting) {
        if (replaceExisting) {
            storyTagRepository.deleteByIdStoryId(story.getId());
        }
        if (tagIds == null || tagIds.isEmpty()) return List.of();
        long existingCount = tagRepository.countByIdIn(tagIds);
        if (existingCount != tagIds.size()) {
            throw new IllegalArgumentException("Invalid tagIds: some tags do not exist");
        }
        List<TagEntity> tags = tagRepository.findAllById(tagIds);
        Map<Long, TagEntity> tagMap = new HashMap<>();
        for (TagEntity tag : tags) {
            tagMap.put(tag.getId(), tag);
        }
        List<TagEntity> orderedTags = new ArrayList<>();
        for (Long id : tagIds) {
            TagEntity tag = tagMap.get(id);
            if (tag != null) orderedTags.add(tag);
        }
        List<StoryTagEntity> links = new ArrayList<>(orderedTags.size());
        for (TagEntity tag : orderedTags) {
            StoryTagEntity st = StoryTagEntity.builder()
                    .id(new StoryTagId(story.getId(), tag.getId()))
                    .story(story)
                    .tag(tag)
                    .build();
            links.add(st);
        }
        storyTagRepository.saveAll(links);
        return orderedTags.stream()
                .map(t -> new TagDto(t.getId(), t.getName(), t.getSlug()))
                .toList();
    }

    private static List<Long> normalizeIds(List<Long> ids) {
        if (ids == null) return List.of();
        return ids.stream()
                .filter(Objects::nonNull)
                .filter(id -> id > 0)
                .distinct()
                .toList();
    }

    private StoryEntity requireStoryById(Long storyId) {
        if (storyId == null || storyId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid story id");
        }
        int rawId;
        try {
            rawId = Math.toIntExact(storyId);
        } catch (ArithmeticException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid story id");
        }
        return storyRepository.findById(rawId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
    }

    private StoryEntity requirePublishedStoryById(Long storyId) {
        StoryEntity story = requireStoryById(storyId);
        if (story.getStatus() != StoryStatus.published) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Story is not public");
        }
        return story;
    }
}
