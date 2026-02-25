package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateStoryRequest;
//<<<<<<< HEAD
import com.example.WebTruyen.dto.response.StorySidebarItemResponse;
import com.example.WebTruyen.dto.response.StorySidebarResponse;
//=======
import com.example.WebTruyen.dto.response.AdminPendingContentResponse;
//>>>>>>> origin/minhfinal1
import com.example.WebTruyen.dto.response.StoryResponse;
import com.example.WebTruyen.dto.response.TagDto;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.enums.StoryCompletionStatus;
import com.example.WebTruyen.entity.enums.StoryKind;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.keys.StoryTagId;
//<<<<<<< HEAD
//=======
import com.example.WebTruyen.entity.model.CommentAndMod.ModerationActionEntity;
//>>>>>>> origin/minhfinal1
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.Content.StoryTagEntity;
import com.example.WebTruyen.entity.model.Content.TagEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.FollowStoryEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.LibraryEntryEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ChapterSegmentRepository;
import com.example.WebTruyen.repository.FollowStoryRepository;
//<<<<<<< HEAD
import com.example.WebTruyen.repository.LibraryEntryRepository;
//=======
import com.example.WebTruyen.repository.ModerationActionRepository;
import com.example.WebTruyen.repository.ReadingHistoryRepository;
//>>>>>>> origin/minhfinal1
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.StoryTagRepository;
import com.example.WebTruyen.repository.TagRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.UserRoleRepository;
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
//<<<<<<< HEAD
import java.util.Collections;
//=======
import java.util.Arrays;
//>>>>>>> origin/minhfinal1
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository storyRepository;
    private final TagRepository tagRepository;
    private final StoryTagRepository storyTagRepository;
    private final StorageService storageService;
    private final UserRepository userRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterSegmentRepository chapterSegmentRepository;
    private final FollowStoryRepository followStoryRepository;
//<<<<<<< HEAD
    private final LibraryEntryRepository libraryEntryRepository;
//=======
    private final ModerationActionRepository moderationActionRepository;
    private final UserRoleRepository userRoleRepository;
//>>>>>>> origin/minhfinal1

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

    // Muc dich: Tong hop du lieu sidebar metadata (thong tin them, truyen tuong tu, cung tac gia). Hieuson + 10h30
    @Transactional
    public StorySidebarResponse getPublicStorySidebar(Integer storyId) {
        StoryEntity story = requirePublishedStoryById(storyId.longValue());

        ChapterEntity latestChapter = chapterRepository
                .findTopByVolume_Story_IdAndStatusOrderByVolume_SequenceIndexDescSequenceIndexDesc(
                        story.getId(),
                        ChapterStatus.published
                )
                .orElse(null);

        Long latestChapterId = latestChapter != null ? latestChapter.getId() : null;
        String latestChapterTitle = latestChapter != null ? latestChapter.getTitle() : null;
        Long latestVolumeId = latestChapter != null && latestChapter.getVolume() != null
                ? latestChapter.getVolume().getId()
                : null;
        String latestVolumeTitle = latestChapter != null && latestChapter.getVolume() != null
                ? latestChapter.getVolume().getTitle()
                : null;

        long followerCount = storyRepository.countLibraryEntriesByStoryId(story.getId());
        Integer weeklyRank = resolveWeeklyRank(story.getId());
        BigDecimal ratingAvg = computeRatingAverage(story.getRatingSum(), story.getRatingCount());

        return new StorySidebarResponse(
                story.getId(),
                latestChapterId,
                latestChapterTitle,
                latestVolumeId,
                latestVolumeTitle,
                followerCount,
                weeklyRank,
                ratingAvg,
                story.getRatingCount(),
                resolveSimilarStories(story),
                resolveSameAuthorStories(story)
        );
    }

    @Transactional
    public List<StoryResponse> getPublishedStories(Integer page, Integer size, String sort) {
        // Parse sort parameter, default to createdAt desc (newest first)
        String sortField = "createdAt";
        String sortDirection = "desc";
        
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            if (parts.length >= 1) {
                sortField = parts[0];
            }
            if (parts.length >= 2) {
                sortDirection = parts[1];
            }
        }
        
        // Get published stories with sorting
        List<StoryEntity> stories;
        switch (sortField.toLowerCase()) {
            case "createdat":
            case "lastupdatedat": // fallback for frontend
            default:
                if ("asc".equalsIgnoreCase(sortDirection)) {
                    stories = storyRepository.findByStatusOrderByCreatedAtAsc(StoryStatus.published);
                } else {
                    stories = storyRepository.findByStatusOrderByCreatedAtDesc(StoryStatus.published);
                }
                break;
            case "title":
                if ("asc".equalsIgnoreCase(sortDirection)) {
                    stories = storyRepository.findByStatusOrderByTitleAsc(StoryStatus.published);
                } else {
                    stories = storyRepository.findByStatusOrderByTitleDesc(StoryStatus.published);
                }
                break;
        }
        
        // Apply pagination
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, stories.size());
        
        if (startIndex >= stories.size()) {
            return List.of();
        }
        
        List<StoryEntity> pagedStories = stories.subList(startIndex, endIndex);
        
        return pagedStories.stream()
                .map(story -> {
                    List<TagDto> tagDtos = story.getStoryTags().stream()
                            .map(StoryTagEntity::getTag)
                            .filter(Objects::nonNull)
                            .map(t -> new TagDto(t.getId(), t.getName(), t.getSlug()))
                            .toList();
                    return toResponse(story, tagDtos, true);
                })
                .toList();
    }

    @Transactional
    public List<StoryResponse> getStoriesByAuthor(UserEntity currentUser) {
        List<StoryEntity> stories = storyRepository.findByAuthor_IdOrderByCreatedAtDesc(currentUser.getId());
        return stories.stream()
                .map(story -> {
                    List<TagDto> tagDtos = story.getStoryTags().stream()
                            .map(StoryTagEntity::getTag)
                            .filter(Objects::nonNull)
                            .map(t -> new TagDto(t.getId(), t.getName(), t.getSlug()))
                            .toList();
                    return toResponse(story, tagDtos, false);
                })
                .toList();
    }

    @Transactional
    public List<StoryResponse> getLibraryStories(UserEntity currentUser) {
        List<StoryEntity> stories = storyRepository
                .findLibraryStoriesByUserIdOrderByAddedAtDesc(currentUser.getId());
        return stories.stream()
                .map(story -> {
                    List<TagDto> tagDtos = story.getStoryTags().stream()
                            .map(StoryTagEntity::getTag)
                            .filter(Objects::nonNull)
                            .map(t -> new TagDto(t.getId(), t.getName(), t.getSlug()))
                            .toList();
                    return toResponse(story, tagDtos, false);
                })
                .toList();
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
        requireStoryById(storyId);
        return libraryEntryRepository
                .findByUser_IdAndStory_Id(currentUser.getId(), storyId)
                .isPresent();
    }

    @Transactional
    public boolean toggleLibraryStatus(UserEntity currentUser, Long storyId) {
        StoryEntity story = requireStoryById(storyId);
        return libraryEntryRepository
                .findByUser_IdAndStory_Id(currentUser.getId(), storyId)
                .map(existing -> {
                    libraryEntryRepository.delete(existing);
                    return false;
                })
                .orElseGet(() -> {
                    libraryEntryRepository.save(
                            LibraryEntryEntity.builder()
                                    .user(currentUser)
                                    .story(story)
                                    .favorite(false)
                                    .addedAt(LocalDateTime.now())
                                    .build()
                    );
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
        long readerCount = story.getViewCount();
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

    // Muc dich: Quy doi StoryEntity sang item sidebar gon nhe cho FE. Hieuson + 10h30
    private StorySidebarItemResponse toSidebarItemResponse(StoryEntity story) {
        long chapterCount = chapterRepository.countByVolume_Story_IdAndStatus(
                story.getId(),
                ChapterStatus.published
        );
        String authorPenName = story.getAuthor() != null
                ? story.getAuthor().getAuthorPenName()
                : null;
        return new StorySidebarItemResponse(
                story.getId(),
                story.getTitle(),
                story.getCoverUrl(),
                authorPenName,
                computeRatingAverage(story.getRatingSum(), story.getRatingCount()),
                story.getRatingCount(),
                chapterCount
        );
    }

    // Muc dich: Tinh xep hang theo luot xem trong danh sach truyen cong khai. Hieuson + 10h30
    private Integer resolveWeeklyRank(Long storyId) {
        List<Long> rankedStoryIds = storyRepository
                .findStoryIdsByStatusOrderByViewCountDescCreatedAtDesc(StoryStatus.published);
        for (int index = 0; index < rankedStoryIds.size(); index++) {
            if (Objects.equals(rankedStoryIds.get(index), storyId)) {
                return index + 1;
            }
        }
        return null;
    }

    // Muc dich: Lay truyen tuong tu theo tag dau tien va tron ngau nhien de da dang sidebar. Hieuson + 10h30
    private List<StorySidebarItemResponse> resolveSimilarStories(StoryEntity story) {
        Long mainTagId = story.getStoryTags().stream()
                .map(StoryTagEntity::getTag)
                .filter(Objects::nonNull)
                .map(TagEntity::getId)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
        if (mainTagId == null) {
            return List.of();
        }

        List<StoryEntity> candidates = new ArrayList<>(
                storyRepository.findPublishedByTagExcludingStory(
                        StoryStatus.published,
                        mainTagId,
                        story.getId()
                )
        );
        if (candidates.isEmpty()) {
            return List.of();
        }

        Collections.shuffle(candidates);
        return candidates.stream()
                .limit(4)
                .map(this::toSidebarItemResponse)
                .toList();
    }

    // Muc dich: Lay top truyen cung tac gia theo luot xem cho block sidebar. Hieuson + 10h30
    private List<StorySidebarItemResponse> resolveSameAuthorStories(StoryEntity story) {
        if (story.getAuthor() == null || story.getAuthor().getId() == null) {
            return List.of();
        }

        List<StoryEntity> stories = storyRepository
                .findTop3ByAuthor_IdAndStatusAndIdNotOrderByViewCountDescCreatedAtDesc(
                        story.getAuthor().getId(),
                        StoryStatus.published,
                        story.getId()
                );
        return stories.stream()
                .map(this::toSidebarItemResponse)
                .toList();
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

    @Transactional
    public List<AdminPendingContentResponse> getPendingModerationContent(UserEntity currentUser) {
        requireModerator(currentUser);

        List<ModerationActionEntity> actions = moderationActionRepository.findByTargetKindInOrderByCreatedAtDesc(
                Arrays.asList(
                        ModerationActionEntity.ModerationTargetKind.story,
                        ModerationActionEntity.ModerationTargetKind.chapter
                )
        );
        Map<String, ModerationActionEntity> latestActionByTarget = latestActionByTarget(actions);

        List<AdminPendingContentResponse> draftStories = storyRepository.findByStatusOrderByCreatedAtDesc(StoryStatus.draft)
                .stream()
                .filter(story -> !latestActionByTarget.containsKey(buildTargetKey(
                        ModerationActionEntity.ModerationTargetKind.story,
                        story.getId()
                )))
                .map(story -> new AdminPendingContentResponse(
                        story.getId(),
                        "story",
                        story.getId(),
                        story.getTitle(),
                        resolveAuthorName(story),
                        resolveGenre(story),
                        resolveRatingAgeClassification(story),
                        story.getCreatedAt(),
                        "pending",
                        null,
                        null,
                        null
                ))
                .toList();

        List<AdminPendingContentResponse> draftChapters = chapterRepository.findByStatusOrderByCreatedAtDesc(ChapterStatus.draft)
                .stream()
                .filter(chapter -> !latestActionByTarget.containsKey(buildTargetKey(
                        ModerationActionEntity.ModerationTargetKind.chapter,
                        chapter.getId()
                )))
                .map(chapter -> toPendingChapterResponse(chapter, null))
                .toList();

        Set<String> seenTargets = new HashSet<>();
        draftStories.forEach(item -> seenTargets.add("story:" + item.contentId()));
        draftChapters.forEach(item -> seenTargets.add("chapter:" + item.contentId()));

        List<AdminPendingContentResponse> processedItems = latestActionByTarget.values().stream()
                .map(this::toProcessedModerationResponse)
                .filter(Objects::nonNull)
                .filter(item -> seenTargets.add(item.contentType() + ":" + item.contentId()))
                .toList();

        return Stream.concat(Stream.concat(draftStories.stream(), draftChapters.stream()), processedItems.stream())
                .sorted((a, b) -> {
                    LocalDateTime left = a.moderationProcessedAt() != null ? a.moderationProcessedAt() : a.submissionDate();
                    LocalDateTime right = b.moderationProcessedAt() != null ? b.moderationProcessedAt() : b.submissionDate();
                    if (left == null && right == null) return 0;
                    if (left == null) return 1;
                    if (right == null) return -1;
                    return right.compareTo(left);
                })
                .toList();
    }

    @Transactional
    public void approveStoryModeration(UserEntity currentUser, Long storyId) {
        requireModerator(currentUser);
        StoryEntity story = requireStoryById(storyId);
        story.setStatus(StoryStatus.published);
        storyRepository.save(story);
        saveModerationAction(currentUser, "approve", ModerationActionEntity.ModerationTargetKind.story, storyId, null);
    }

    @Transactional
    public void rejectStoryModeration(UserEntity currentUser, Long storyId, String note) {
        requireModerator(currentUser);
        StoryEntity story = requireStoryById(storyId);
        story.setStatus(StoryStatus.archived);
        storyRepository.save(story);
        saveModerationAction(currentUser, "reject", ModerationActionEntity.ModerationTargetKind.story, storyId, note);
    }

    @Transactional
    public void requestStoryEditModeration(UserEntity currentUser, Long storyId, String note) {
        requireModerator(currentUser);
        requireStoryById(storyId);
        saveModerationAction(currentUser, "request_edit", ModerationActionEntity.ModerationTargetKind.story, storyId, note);
    }

    @Transactional
    public void approveChapterModeration(UserEntity currentUser, Long chapterId) {
        requireModerator(currentUser);
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        chapter.setStatus(ChapterStatus.published);
        chapter.setLastUpdateAt(LocalDateTime.now());
        chapterRepository.save(chapter);
        saveModerationAction(currentUser, "approve", ModerationActionEntity.ModerationTargetKind.chapter, chapterId, null);
    }

    @Transactional
    public void rejectChapterModeration(UserEntity currentUser, Long chapterId, String note) {
        requireModerator(currentUser);
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        chapter.setStatus(ChapterStatus.archived);
        chapter.setLastUpdateAt(LocalDateTime.now());
        chapterRepository.save(chapter);
        saveModerationAction(currentUser, "reject", ModerationActionEntity.ModerationTargetKind.chapter, chapterId, note);
    }

    @Transactional
    public void requestChapterEditModeration(UserEntity currentUser, Long chapterId, String note) {
        requireModerator(currentUser);
        chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        saveModerationAction(currentUser, "request_edit", ModerationActionEntity.ModerationTargetKind.chapter, chapterId, note);
    }

    private AdminPendingContentResponse toPendingChapterResponse(ChapterEntity chapter, ModerationActionEntity action) {
        StoryEntity story = chapter.getVolume().getStory();
        return new AdminPendingContentResponse(
                chapter.getId(),
                "chapter",
                story.getId(),
                story.getTitle(),
                resolveAuthorName(story),
                resolveGenre(story),
                resolveRatingAgeClassification(story),
                chapter.getCreatedAt(),
                action == null ? "pending" : resolveModerationStatus(action.getActionType()),
                action == null ? null : action.getActionType(),
                action == null ? null : action.getNotes(),
                action == null ? null : action.getCreatedAt()
        );
    }

    private Map<String, ModerationActionEntity> latestActionByTarget(List<ModerationActionEntity> actions) {
        Map<String, ModerationActionEntity> latest = new HashMap<>();
        for (ModerationActionEntity action : actions) {
            String key = buildTargetKey(action.getTargetKind(), action.getTargetId());
            latest.putIfAbsent(key, action);
        }
        return latest;
    }

    private String buildTargetKey(ModerationActionEntity.ModerationTargetKind targetKind, Long targetId) {
        return targetKind.name() + ":" + targetId;
    }

    private AdminPendingContentResponse toProcessedModerationResponse(ModerationActionEntity action) {
        if (action.getTargetKind() == ModerationActionEntity.ModerationTargetKind.story) {
            StoryEntity story = requireStoryByIdOrNull(action.getTargetId());
            if (story == null) {
                return null;
            }
            return new AdminPendingContentResponse(
                    story.getId(),
                    "story",
                    story.getId(),
                    story.getTitle(),
                    resolveAuthorName(story),
                    resolveGenre(story),
                    resolveRatingAgeClassification(story),
                    story.getCreatedAt(),
                    resolveModerationStatus(action.getActionType()),
                    action.getActionType(),
                    action.getNotes(),
                    action.getCreatedAt()
            );
        }
        if (action.getTargetKind() == ModerationActionEntity.ModerationTargetKind.chapter) {
            ChapterEntity chapter = chapterRepository.findById(action.getTargetId()).orElse(null);
            if (chapter == null) {
                return null;
            }
            return toPendingChapterResponse(chapter, action);
        }
        return null;
    }

    private StoryEntity requireStoryByIdOrNull(Long storyId) {
        if (storyId == null || storyId <= 0) {
            return null;
        }
        int rawId;
        try {
            rawId = Math.toIntExact(storyId);
        } catch (ArithmeticException ex) {
            return null;
        }
        return storyRepository.findById(rawId).orElse(null);
    }

    private String resolveModerationStatus(String actionType) {
        if (actionType == null || actionType.isBlank()) {
            return "processed";
        }
        String normalized = actionType.trim().toLowerCase();
        if (normalized.contains("approve")) {
            return "approved";
        }
        if (normalized.contains("reject")) {
            return "rejected";
        }
        if (normalized.contains("request_edit") || normalized.contains("request-edit") || normalized.contains("edit")) {
            return "request_edit";
        }
        return "processed";
    }

    private void saveModerationAction(
            UserEntity admin,
            String actionType,
            ModerationActionEntity.ModerationTargetKind targetKind,
            Long targetId,
            String note
    ) {
        ModerationActionEntity action = ModerationActionEntity.builder()
                .admin(admin)
                .actionType(actionType)
                .targetKind(targetKind)
                .targetId(targetId)
                .notes(note)
                .createdAt(LocalDateTime.now())
                .build();
        moderationActionRepository.save(action);
    }

    private String resolveAuthorName(StoryEntity story) {
        if (story.getAuthor() == null) {
            return "Unknown";
        }
        String penName = story.getAuthor().getAuthorPenName();
        if (penName != null && !penName.isBlank()) {
            return penName;
        }
        String username = story.getAuthor().getUsername();
        if (username != null && !username.isBlank()) {
            return username;
        }
        return "Unknown";
    }

    private String resolveGenre(StoryEntity story) {
        List<String> genres = story.getStoryTags().stream()
                .map(StoryTagEntity::getTag)
                .filter(Objects::nonNull)
                .map(TagEntity::getName)
                .filter(Objects::nonNull)
                .filter(name -> !name.isBlank())
                .toList();
        if (genres.isEmpty()) {
            return "Uncategorized";
        }
        return String.join(", ", genres);
    }

    private String resolveRatingAgeClassification(StoryEntity story) {
        if (story.getRatingCount() > 0 && story.getRatingAvg() != null) {
            return "Rating " + story.getRatingAvg();
        }
        return "Unrated / N-A";
    }

    private void requireModerator(UserEntity currentUser) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Long userId = currentUser.getId();
        boolean allowed = userId != null && (
                userRoleRepository.existsByUser_IdAndRole_Code(userId, "ADMIN")
                        || userRoleRepository.existsByUser_IdAndRole_Code(userId, "MOD")
        );

        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
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
