package com.example.WebTruyen.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.Locale;
import java.util.stream.Stream;

import org.jsoup.Jsoup;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.WebTruyen.dto.request.UpdateStoryLibraryRequest;
import com.example.WebTruyen.dto.request.CreateStoryRequest;
import com.example.WebTruyen.dto.response.AdminPendingContentResponse;
import com.example.WebTruyen.dto.response.LibraryAlbumOptionResponse;
import com.example.WebTruyen.dto.response.LibraryStoryResponse;
import com.example.WebTruyen.dto.response.StoryRatingBreakdownItemResponse;
import com.example.WebTruyen.dto.response.StoryResponse;
import com.example.WebTruyen.dto.response.StoryLibraryDialogResponse;
import com.example.WebTruyen.dto.response.StoryResumePointResponse;
import com.example.WebTruyen.dto.response.StorySidebarItemResponse;
import com.example.WebTruyen.dto.response.StorySidebarResponse;
import com.example.WebTruyen.dto.response.TagDto;
import com.example.WebTruyen.entity.enums.ChapterApprovalStatus;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.enums.LibraryAlbumVisibility;
import com.example.WebTruyen.entity.enums.ReadingStatus;
import com.example.WebTruyen.entity.enums.StoryApprovalStatus;
import com.example.WebTruyen.entity.enums.StoryCompletionStatus;
import com.example.WebTruyen.entity.enums.StoryKind;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.keys.StoryTagId;
import com.example.WebTruyen.entity.keys.LibraryAlbumItemId;
import com.example.WebTruyen.entity.model.CommentAndMod.ModerationActionEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.Content.StoryTagEntity;
import com.example.WebTruyen.entity.model.Content.TagEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.FollowStoryEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.FollowUserEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.LibraryAlbumEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.LibraryAlbumItemEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.LibraryEntryEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ChapterSegmentRepository;
import com.example.WebTruyen.repository.FollowStoryRepository;
import com.example.WebTruyen.repository.FollowUserRepository;
import com.example.WebTruyen.service.NotificationService;
import com.example.WebTruyen.repository.LibraryAlbumItemRepository;
import com.example.WebTruyen.repository.LibraryAlbumRepository;
import com.example.WebTruyen.repository.LibraryEntryRepository;
import com.example.WebTruyen.repository.ModerationActionRepository;
import com.example.WebTruyen.repository.ReadingHistoryRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.StoryReviewRepository;
import com.example.WebTruyen.repository.StoryTagRepository;
import com.example.WebTruyen.repository.TagRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.UserRoleRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StoryService {
    private static final Duration APPROVAL_RESUBMIT_COOLDOWN = Duration.ofHours(24);

    private final StoryRepository storyRepository;
    private final TagRepository tagRepository;
    private final StoryTagRepository storyTagRepository;
    private final StorageService storageService;
    private final UserRepository userRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterSegmentRepository chapterSegmentRepository;
    private final FollowStoryRepository followStoryRepository;
    private final FollowUserRepository followUserRepository;
    private final NotificationService notificationService;
//<<<<<<< HEAD
    private final LibraryEntryRepository libraryEntryRepository;
//=======
    private final ModerationActionRepository moderationActionRepository;
    private final UserRoleRepository userRoleRepository;
//>>>>>>> origin/minhfinal1
    private final LibraryAlbumRepository libraryAlbumRepository;
    private final LibraryAlbumItemRepository libraryAlbumItemRepository;
    private final ReadingHistoryRepository readingHistoryRepository;
    private final StoryReviewRepository storyReviewRepository;

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
        StoryStatus requestedStatus = resolveStatus(req);

        if (requestedStatus == StoryStatus.published) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Truyện phải được duyệt trước khi công khai"
            );
        }

        StoryEntity story = StoryEntity.builder()
                .author(currentUser)
                .title(req.title().trim())
                .summary(req.summaryHtml())
                .coverUrl(coverUrl)
                .status(requestedStatus)
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
                resolveRatingBreakdown(story.getId()),
                resolveSimilarStories(story),
                resolveSameAuthorStories(story)
        );
    }

    @Transactional
    public StoryResumePointResponse getStoryResumePoint(UserEntity currentUser, Integer storyId) {
        if (currentUser == null || storyId == null) {
            return null;
        }

        StoryEntity story = requirePublishedStoryById(storyId.longValue());

        return readingHistoryRepository
                .findByUserIdAndStoryId(Long.valueOf(currentUser.getId()), Long.valueOf(story.getId()))
                .map(history -> {
                    Long chapterId = history.getLastChapter() != null
                            ? history.getLastChapter().getId()
                            : history.getLastSegment() != null && history.getLastSegment().getChapter() != null
                                ? history.getLastSegment().getChapter().getId()
                                : null;
                    Long segmentId = history.getLastSegment() != null
                            ? history.getLastSegment().getId()
                            : null;

                    if (chapterId == null || segmentId == null) {
                        return null;
                    }

                    return new StoryResumePointResponse(story.getId(), chapterId, segmentId);
                })
                .orElse(null);
    }

    @Transactional
    // Hieu Son - ngay 26/02/2026 | v1.0.0-search | branch: minhfinal2
    // Sua ham: bo sung tim kiem nang cao cho story cong khai (q, tac gia, tinh trang, tag AND), van giu phan trang/sap xep.
    public List<StoryResponse> getPublishedStories(
            Integer page,
            Integer size,
            String sort,
            String q,
            String author,
            String kind,
            String completionStatus,
            List<Long> tagIds,
            List<Long> excludeTagIds
    ) {
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
        
        String normalizedQuery = trimToNull(q);
        String normalizedAuthor = trimToNull(author);
        StoryKind kindFilter = parseKindForSearch(kind);
        StoryCompletionStatus completionStatusFilter = parseCompletionStatusForSearch(completionStatus);
        List<Long> normalizedTagIds = normalizeIds(tagIds);
        Set<Long> excludedTagIdSet = new HashSet<>(normalizeIds(excludeTagIds));
        List<Long> queryTagIds = normalizedTagIds.isEmpty() ? List.of(-1L) : normalizedTagIds;
        long tagCount = normalizedTagIds.size();

        List<StoryEntity> stories = storyRepository.findPublishedStoriesWithAdvancedFilters(
                StoryStatus.published,
                null,
                kindFilter,
                normalizedAuthor,
                completionStatusFilter,
                queryTagIds,
                tagCount
        );

        if (normalizedQuery != null) {
            stories = stories.stream()
                    .filter(story -> matchesSearchQuery(story.getTitle(), normalizedQuery))
                    .toList();
        }

        if (!excludedTagIdSet.isEmpty()) {
            stories = stories.stream()
                    .filter(story -> story.getStoryTags().stream()
                            .map(StoryTagEntity::getTag)
                            .filter(Objects::nonNull)
                            .map(TagEntity::getId)
                            .noneMatch(excludedTagIdSet::contains))
                    .toList();
        }

        Comparator<StoryEntity> comparator = buildPublishedStorySortComparator(sortField);
        if (comparator != null) {
            stories = new ArrayList<>(stories);
            stories.sort("asc".equalsIgnoreCase(sortDirection) ? comparator : comparator.reversed());
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
                    return toResponse(story, buildTagDtos(story), false);
                })
                .toList();
    }

    @Transactional
    public List<LibraryStoryResponse> getLibraryStories(UserEntity currentUser) {
        return libraryEntryRepository.findByUser_IdOrderByAddedAtDesc(currentUser.getId()).stream()
                .map(this::toLibraryResponse)
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
    public Map<String, Boolean> getLibraryStatus(UserEntity currentUser, Long storyId) {
        requireStoryById(storyId);
        if (currentUser == null) {
            return Map.of("saved", false, "favorite", false);
        }
        return libraryEntryRepository
                .findByUser_IdAndStory_Id(currentUser.getId(), storyId)
                .map(entry -> Map.of(
                        "saved", true,
                        "favorite", entry.isFavorite()
                ))
                .orElseGet(() -> Map.of("saved", false, "favorite", false));
    }

    @Transactional
    public StoryLibraryDialogResponse getStoryLibraryDialog(UserEntity currentUser, Long storyId) {
        requireStoryById(storyId);
        return buildStoryLibraryDialog(currentUser, storyId);
    }

    @Transactional
    public StoryLibraryDialogResponse updateStoryLibraryDialog(UserEntity currentUser, Long storyId, UpdateStoryLibraryRequest req) {
        StoryEntity story = requireStoryById(storyId);
        ReadingStatus targetStatus = parseLibraryReadingStatus(req != null ? req.readingStatus() : null);
        Set<Long> selectedAlbumIds = normalizeAlbumIds(req != null ? req.albumIds() : null);

        List<LibraryAlbumEntity> userAlbums = libraryAlbumRepository.findByUser_IdOrderByUpdatedAtDesc(currentUser.getId());
        validateSelectedAlbums(selectedAlbumIds, userAlbums);

        if (targetStatus == null) {
            List<LibraryAlbumEntity> touchedAlbums = userAlbums.stream()
                    .filter(album -> albumContainsStory(album, storyId))
                    .toList();
            touchedAlbums.forEach(album -> {
                if (album.getItems() == null) {
                    return;
                }
                album.getItems().removeIf(item -> item.getStory() != null && Objects.equals(item.getStory().getId(), storyId));
            });
            libraryAlbumItemRepository.deleteAllForUserStory(currentUser.getId(), storyId);
            libraryEntryRepository.findByUser_IdAndStory_Id(currentUser.getId(), storyId)
                    .ifPresent(libraryEntryRepository::delete);
            touchAlbums(touchedAlbums);
            return buildStoryLibraryDialog(currentUser, storyId);
        }

        LibraryEntryEntity entry = libraryEntryRepository
                .findByUser_IdAndStory_Id(currentUser.getId(), storyId)
                .orElseGet(() -> LibraryEntryEntity.builder()
                        .user(currentUser)
                        .story(story)
                        .favorite(false)
                        .addedAt(LocalDateTime.now())
                        .build());

        entry.setReadingStatus(targetStatus);
        libraryEntryRepository.save(entry);
        syncAlbumMemberships(userAlbums, story, selectedAlbumIds);

        return buildStoryLibraryDialog(currentUser, storyId);
    }

    @Transactional
    public Map<String, Boolean> toggleLibraryStatus(UserEntity currentUser, Long storyId) {
        StoryEntity story = requireStoryById(storyId);
        return libraryEntryRepository
                .findByUser_IdAndStory_Id(currentUser.getId(), storyId)
                .map(existing -> {
                    libraryEntryRepository.delete(existing);
                    return Map.of("saved", false, "favorite", false);
                })
                .orElseGet(() -> {
                    libraryEntryRepository.save(
                            LibraryEntryEntity.builder()
                                    .user(currentUser)
                                    .story(story)
                                    .readingStatus(ReadingStatus.plan_to_read)
                                    .favorite(false)
                                    .addedAt(LocalDateTime.now())
                                    .build()
                    );
                    return Map.of("saved", true, "favorite", false);
                });
    }

    @Transactional
    public Map<String, Boolean> toggleLibraryFavoriteStatus(UserEntity currentUser, Long storyId) {
        StoryEntity story = requireStoryById(storyId);
        LibraryEntryEntity entry = libraryEntryRepository
                .findByUser_IdAndStory_Id(currentUser.getId(), storyId)
                .orElseGet(() -> LibraryEntryEntity.builder()
                        .user(currentUser)
                        .story(story)
                        .readingStatus(ReadingStatus.plan_to_read)
                        .favorite(false)
                        .addedAt(LocalDateTime.now())
                        .build());

        entry.setFavorite(!entry.isFavorite());
        LibraryEntryEntity savedEntry = libraryEntryRepository.save(entry);
        return Map.of(
                "saved", true,
                "favorite", savedEntry.isFavorite()
        );
    }

    private StoryLibraryDialogResponse buildStoryLibraryDialog(UserEntity currentUser, Long storyId) {
        if (currentUser == null) {
            return new StoryLibraryDialogResponse(false, false, null, List.of());
        }

        LibraryEntryEntity entry = libraryEntryRepository
                .findByUser_IdAndStory_Id(currentUser.getId(), storyId)
                .orElse(null);

        List<LibraryAlbumOptionResponse> albums = libraryAlbumRepository
                .findByUser_IdOrderByUpdatedAtDesc(currentUser.getId())
                .stream()
                .map(album -> toLibraryAlbumOptionResponse(album, storyId))
                .toList();

        return new StoryLibraryDialogResponse(
                entry != null,
                entry != null && entry.isFavorite(),
                entry != null && entry.getReadingStatus() != null ? entry.getReadingStatus().name() : null,
                albums
        );
    }

    private LibraryAlbumOptionResponse toLibraryAlbumOptionResponse(LibraryAlbumEntity album, Long storyId) {
        List<LibraryAlbumItemEntity> items = album.getItems() != null ? album.getItems() : List.of();
        boolean containsStory = albumContainsStory(album, storyId);
        String coverUrl = items.stream()
                .filter(item -> item.getStory() != null)
                .max(Comparator.comparing(
                        LibraryAlbumItemEntity::getAddedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .map(LibraryAlbumItemEntity::getStory)
                .filter(Objects::nonNull)
                .map(StoryEntity::getCoverUrl)
                .orElse(null);

        return new LibraryAlbumOptionResponse(
                album.getId(),
                album.getName(),
                album.getDescription(),
                album.getVisibility() != null ? album.getVisibility().getValue() : LibraryAlbumVisibility.PRIVATE.getValue(),
                (long) items.size(),
                coverUrl,
                containsStory
        );
    }

    private boolean albumContainsStory(LibraryAlbumEntity album, Long storyId) {
        List<LibraryAlbumItemEntity> items = album.getItems();
        if (items == null || items.isEmpty()) {
            return false;
        }
        return items.stream()
                .map(LibraryAlbumItemEntity::getStory)
                .filter(Objects::nonNull)
                .anyMatch(story -> Objects.equals(story.getId(), storyId));
    }

    private void validateSelectedAlbums(Set<Long> selectedAlbumIds, List<LibraryAlbumEntity> userAlbums) {
        if (selectedAlbumIds.isEmpty()) {
            return;
        }

        Set<Long> ownedAlbumIds = userAlbums.stream()
                .map(LibraryAlbumEntity::getId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());

        if (!ownedAlbumIds.containsAll(selectedAlbumIds)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bộ sưu tập không tồn tại hoặc không thuộc về bạn");
        }
    }

    private Set<Long> normalizeAlbumIds(List<Long> albumIds) {
        if (albumIds == null || albumIds.isEmpty()) {
            return Set.of();
        }
        Set<Long> normalized = new HashSet<>();
        albumIds.stream()
                .filter(Objects::nonNull)
                .map(Long::valueOf)
                .forEach(normalized::add);
        return normalized;
    }

    private ReadingStatus parseLibraryReadingStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            return null;
        }

        String normalized = rawStatus.trim().toLowerCase();
        if ("none".equals(normalized)) {
            return null;
        }

        try {
            return ReadingStatus.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái đọc không hợp lệ");
        }
    }

    private void syncAlbumMemberships(List<LibraryAlbumEntity> userAlbums, StoryEntity story, Set<Long> selectedAlbumIds) {
        if (userAlbums.isEmpty()) {
            return;
        }

        List<LibraryAlbumEntity> touchedAlbums = new ArrayList<>();
        for (LibraryAlbumEntity album : userAlbums) {
            boolean shouldContain = selectedAlbumIds.contains(album.getId());
            boolean currentlyContains = albumContainsStory(album, story.getId());

            if (shouldContain && !currentlyContains) {
                LibraryAlbumItemEntity newItem =
                        LibraryAlbumItemEntity.builder()
                                .id(new LibraryAlbumItemId(album.getId(), story.getId()))
                                .album(album)
                                .story(story)
                                .build();
                libraryAlbumItemRepository.save(
                        newItem
                );
                if (album.getItems() != null) {
                    album.getItems().add(newItem);
                }
                touchedAlbums.add(album);
                continue;
            }

            if (!shouldContain && currentlyContains) {
                libraryAlbumItemRepository.deleteFromAlbum(album.getId(), story.getId());
                if (album.getItems() != null) {
                    album.getItems().removeIf(item -> item.getStory() != null && Objects.equals(item.getStory().getId(), story.getId()));
                }
                touchedAlbums.add(album);
            }
        }

        touchAlbums(touchedAlbums);
    }

    private void touchAlbums(List<LibraryAlbumEntity> albums) {
        if (albums == null || albums.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        albums.stream()
                .filter(Objects::nonNull)
                .forEach(album -> album.setUpdatedAt(now));
        libraryAlbumRepository.saveAll(albums);
    }

    @Transactional
    public StoryResponse updateStory(UserEntity currentUser, Integer storyId, CreateStoryRequest req, MultipartFile cover) {
        StoryEntity story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));

        Long authorId = story.getAuthor() != null ? story.getAuthor().getId() : null;
        if (authorId == null || !authorId.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not the owner of this story");
        }

        String previousTitle = normalizeCompareText(story.getTitle());
        String previousSummary = normalizeCompareText(story.getSummary());
        StoryStatus previousStatus = story.getStatus() == null ? StoryStatus.draft : story.getStatus();
        StoryApprovalStatus currentApprovalStatus = story.getApprovalStatus();

        String nextTitle = req.title() != null && !req.title().isBlank()
                ? req.title().trim()
                : story.getTitle();
        String nextSummary = req.summaryHtml() != null
                ? req.summaryHtml()
                : story.getSummary();
        boolean hasApprovalSensitiveChange =
                !Objects.equals(previousTitle, normalizeCompareText(nextTitle))
                        || !Objects.equals(previousSummary, normalizeCompareText(nextSummary));

        StoryApprovalStatus effectiveApprovalStatus = hasApprovalSensitiveChange
                && currentApprovalStatus != StoryApprovalStatus.rejected
                ? null
                : currentApprovalStatus;

        StoryStatus nextStatus = resolveStatus(req);
        if (hasApprovalSensitiveChange && previousStatus == StoryStatus.published) {
            nextStatus = StoryStatus.draft;
        }
        if (previousStatus == StoryStatus.draft
                && nextStatus == StoryStatus.published
                && effectiveApprovalStatus != StoryApprovalStatus.approved) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Truyện phải được duyệt trước khi công khai"
            );
        }

        story.setTitle(nextTitle);
        story.setSummary(nextSummary);
        story.setStatus(nextStatus);
        if (hasApprovalSensitiveChange && currentApprovalStatus != StoryApprovalStatus.rejected) {
            story.setApprovalStatus(null);
            story.setApprovalUpdatedAt(LocalDateTime.now());
        }

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
        if (previousStatus != StoryStatus.published && saved.getStatus() == StoryStatus.published) {
            notifyAuthorFollowersAboutNewStory(saved);
        }
        return toResponse(saved, tagDtos, false);
    }

    @Transactional
    public StoryApprovalStatus submitStoryForApproval(Long storyId, Long authorId) {
        if (authorId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        if (storyId == null || storyId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid story id");
        }

        int rawStoryId;
        try {
            rawStoryId = Math.toIntExact(storyId);
        } catch (ArithmeticException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid story id");
        }

        StoryEntity story = storyRepository.findByIdAndAuthorId(rawStoryId, authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));

        StoryApprovalStatus approvalStatus = story.getApprovalStatus();
        if (approvalStatus == StoryApprovalStatus.pending || approvalStatus == StoryApprovalStatus.approved) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Story already submitted for review");
        }
        if (approvalStatus == StoryApprovalStatus.rejected) {
            long hoursRemaining = computeResubmitHoursRemaining(story.getApprovalUpdatedAt());
            if (hoursRemaining > 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Truyện bị từ chối duyệt. Vui lòng gửi lại sau " + hoursRemaining + " giờ"
                );
            }
        }

        story.setApprovalStatus(StoryApprovalStatus.pending);
        story.setApprovalUpdatedAt(LocalDateTime.now());
        storyRepository.save(story);
        return story.getApprovalStatus();
    }

    private void validateCreateStoryRequest(CreateStoryRequest req) {
        if (req.title() == null || req.title().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
    }

    // Hieu Son - ngay 27/02/2026 | v1.0.1-search | branch: minhfinal2
    // Sua ham: bo sung savedCount (luot luu vao thu vien) vao StoryResponse de FE hien thi dung.
    private StoryResponse toResponse(StoryEntity story, List<TagDto> tags, boolean publishedOnly) {
        long readerCount = story.getViewCount();
        long savedCount = storyRepository.countLibraryEntriesByStoryId(story.getId());
        long wordCount = countStoryWords(story.getId(), publishedOnly);
        LocalDateTime lastUpdatedAt = chapterRepository.findLatestUpdateAtByStoryId(story.getId());
        BigDecimal ratingAvg = computeRatingAverage(story.getRatingSum(), story.getRatingCount());

        String authorPenName = story.getAuthor() != null ? story.getAuthor().getAuthorPenName() : null;
        String translatorPenName = story.getKind() == StoryKind.translated ? authorPenName : null;
        Long originalAuthorUserId = story.getOriginalAuthorUser() != null ? story.getOriginalAuthorUser().getId() : null;

        ModerationActionEntity latestAction = resolveLatestModerationAction(
                ModerationActionEntity.ModerationTargetKind.story,
                story.getId()
        );
        StoryApprovalStatus rawApprovalStatus = story.getApprovalStatus();
        StoryApprovalStatus effectiveApprovalStatus = resolveEffectiveApprovalStatus(
                rawApprovalStatus,
                story.getApprovalUpdatedAt()
        );
        String moderationNote = resolveRejectedModerationNote(rawApprovalStatus, latestAction);
        LocalDateTime resubmitAvailableAt = computeResubmitAvailableAt(story.getApprovalUpdatedAt());
        Long resubmitHoursRemaining = rawApprovalStatus == StoryApprovalStatus.rejected
                ? computeResubmitHoursRemaining(story.getApprovalUpdatedAt())
                : null;

        return new StoryResponse(
                story.getId(),
                story.getAuthor() != null ? story.getAuthor().getId() : null,
                authorPenName,
                translatorPenName,
                story.getTitle(),
                story.getSummary(),
                story.getCoverUrl(),
                story.getStatus() != null ? story.getStatus().name() : null,
                effectiveApprovalStatus != null ? effectiveApprovalStatus.name() : null,
                moderationNote,
                resubmitAvailableAt,
                resubmitHoursRemaining,
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

    StoryResponse toStoryResponse(StoryEntity story, boolean publishedOnly) {
        return toResponse(story, buildTagDtos(story), publishedOnly);
    }

    private List<TagDto> buildTagDtos(StoryEntity story) {
        return story.getStoryTags().stream()
                .map(StoryTagEntity::getTag)
                .filter(Objects::nonNull)
                .map(tag -> new TagDto(tag.getId(), tag.getName(), tag.getSlug()))
                .toList();
    }

    private LibraryStoryResponse toLibraryResponse(LibraryEntryEntity entry) {
        StoryEntity story = entry.getStory();
        StoryResponse base = toResponse(story, buildTagDtos(story), false);
        ChapterEntity latestChapter = chapterRepository
                .findTopByVolume_Story_IdAndStatusOrderByVolume_SequenceIndexDescSequenceIndexDesc(
                        story.getId(),
                        ChapterStatus.published
                )
                .orElse(null);
        long chapterCount = chapterRepository.countByVolume_Story_IdAndStatus(
                story.getId(),
                ChapterStatus.published
        );

        return new LibraryStoryResponse(
                base.id(),
                base.authorId(),
                base.authorPenName(),
                base.translatorPenName(),
                base.title(),
                base.summaryHtml(),
                base.coverUrl(),
                base.status(),
                base.approvalStatus(),
                base.kind(),
                base.completionStatus(),
                base.completedAt(),
                base.originalAuthorName(),
                base.originalAuthorUserId(),
                base.ratingSum(),
                base.ratingCount(),
                base.ratingAvg(),
                base.readerCount(),
                base.savedCount(),
                base.wordCount(),
                base.lastUpdatedAt(),
                base.tags(),
                base.createdAt(),
                entry.getReadingStatus() != null ? entry.getReadingStatus().name() : null,
                entry.isFavorite(),
                entry.getAddedAt(),
                formatLatestChapterLabel(latestChapter),
                formatLatestVolumeLabel(latestChapter),
                chapterCount
        );
    }

    private String formatLatestChapterLabel(ChapterEntity latestChapter) {
        if (latestChapter == null) {
            return null;
        }

        Integer sequenceIndex = latestChapter.getSequenceIndex();
        String title = latestChapter.getTitle() != null ? latestChapter.getTitle().trim() : "";
        if (sequenceIndex != null && sequenceIndex > 0 && !title.isBlank()) {
            return "Chương " + sequenceIndex + ": " + title;
        }
        if (sequenceIndex != null && sequenceIndex > 0) {
            return "Chương " + sequenceIndex;
        }
        if (!title.isBlank()) {
            return title;
        }
        return null;
    }

    private String formatLatestVolumeLabel(ChapterEntity latestChapter) {
        if (latestChapter == null || latestChapter.getVolume() == null) {
            return null;
        }

        String volumeTitle = latestChapter.getVolume().getTitle() != null
                ? latestChapter.getVolume().getTitle().trim()
                : "";
        if (!volumeTitle.isBlank()) {
            return volumeTitle;
        }

        Integer volumeSequence = latestChapter.getVolume().getSequenceIndex();
        if (volumeSequence != null && volumeSequence > 0) {
            return "Tập " + volumeSequence;
        }
        return null;
    }

    private BigDecimal computeRatingAverage(long ratingSum, int ratingCount) {
        if (ratingCount <= 0) {
            return null;
        }
        return BigDecimal.valueOf(ratingSum)
                .divide(BigDecimal.valueOf(ratingCount), 2, RoundingMode.HALF_UP);
    }

    private List<StoryRatingBreakdownItemResponse> resolveRatingBreakdown(Long storyId) {
        Map<Integer, Long> countByRating = new HashMap<>();
        for (Object[] row : storyReviewRepository.countByStoryIdGroupByRating(storyId)) {
            if (row == null || row.length < 2 || row[0] == null) {
                continue;
            }

            int rating = ((Number) row[0]).intValue();
            long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            countByRating.put(rating, Math.max(0L, count));
        }

        List<StoryRatingBreakdownItemResponse> items = new ArrayList<>();
        for (int rating = 5; rating >= 1; rating--) {
            items.add(new StoryRatingBreakdownItemResponse(
                    rating,
                    countByRating.getOrDefault(rating, 0L)
            ));
        }
        return items;
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

    // Hieu Son - ngay 26/02/2026
    // Ham ho tro parser completionStatus trong tim kiem nang cao: gia tri khong hop le thi bo qua filter.
    private StoryCompletionStatus parseCompletionStatusForSearch(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return StoryCompletionStatus.valueOf(raw.trim().toLowerCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private StoryKind parseKindForSearch(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return StoryKind.valueOf(raw.trim().toLowerCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    // Hieu Son - ngay 26/02/2026
    // Ham ho tro sap xep ket qua truyen cong khai theo truong sort nhan tu query.
    private Comparator<StoryEntity> buildPublishedStorySortComparator(String sortField) {
        if (sortField == null || sortField.isBlank()) {
            return Comparator.comparing(StoryEntity::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
        }

        String normalized = sortField.trim().toLowerCase();
        return switch (normalized) {
            case "title" -> Comparator.comparing(
                    story -> String.valueOf(story.getTitle()).toLowerCase(),
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            case "viewcount", "readercount" -> Comparator.comparingLong(StoryEntity::getViewCount);
            case "createdat", "lastupdatedat" -> Comparator.comparing(
                    StoryEntity::getCreatedAt,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            default -> Comparator.comparing(
                    StoryEntity::getCreatedAt,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
        };
    }

    // Hieu Son - ngay 26/02/2026
    // Ham ho tro chuan hoa chuoi tim kiem.
    private String normalizeCompareText(String value) {
        return value == null ? "" : value.trim();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean matchesSearchQuery(String title, String query) {
        String normalizedTitle = normalizeSearchText(title);
        String normalizedQuery = normalizeSearchText(query);
        if (normalizedQuery == null) {
            return true;
        }
        if (normalizedTitle == null) {
            return false;
        }
        if (normalizedTitle.contains(normalizedQuery)) {
            return true;
        }

        List<String> tokens = Arrays.stream(normalizedQuery.split(" "))
                .map(String::trim)
                .filter(token -> !token.isEmpty())
                .toList();

        return !tokens.isEmpty() && tokens.stream().allMatch(normalizedTitle::contains);
    }

    private String normalizeSearchText(String value) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            return null;
        }

        return Normalizer.normalize(trimmed, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT)
                .replace('\u0111', 'd')
                .replace('\u0110', 'd')
                .replaceAll("[^\\p{L}\\p{N}]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
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

    ModerationActionEntity resolveLatestModerationAction(
            ModerationActionEntity.ModerationTargetKind targetKind,
            Long targetId
    ) {
        if (targetId == null) {
            return null;
        }
        return moderationActionRepository
                .findTopByTargetKindAndTargetIdOrderByCreatedAtDesc(targetKind, targetId)
                .orElse(null);
    }

    String resolveRejectedModerationNote(StoryApprovalStatus approvalStatus, ModerationActionEntity action) {
        if (approvalStatus != StoryApprovalStatus.rejected || action == null) {
            return null;
        }
        String actionType = action.getActionType() == null ? "" : action.getActionType().trim().toLowerCase(Locale.ROOT);
        if (!actionType.contains("reject")) {
            return null;
        }
        return trimToNull(action.getNotes());
    }

    StoryApprovalStatus resolveEffectiveApprovalStatus(
            StoryApprovalStatus approvalStatus,
            LocalDateTime approvalUpdatedAt
    ) {
        if (approvalStatus == StoryApprovalStatus.rejected
                && computeResubmitHoursRemaining(approvalUpdatedAt) == 0L) {
            return null;
        }
        return approvalStatus;
    }

    LocalDateTime computeResubmitAvailableAt(LocalDateTime approvalUpdatedAt) {
        if (approvalUpdatedAt == null) {
            return null;
        }
        return approvalUpdatedAt.plus(APPROVAL_RESUBMIT_COOLDOWN);
    }

    long computeResubmitHoursRemaining(LocalDateTime approvalUpdatedAt) {
        LocalDateTime availableAt = computeResubmitAvailableAt(approvalUpdatedAt);
        if (availableAt == null) {
            return 0L;
        }
        Duration remaining = Duration.between(LocalDateTime.now(), availableAt);
        if (remaining.isZero() || remaining.isNegative()) {
            return 0L;
        }
        long minutesRemaining = remaining.toMinutes();
        return Math.max(1L, (minutesRemaining + 59L) / 60L);
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

        List<AdminPendingContentResponse> pendingStories = storyRepository.findByApprovalStatusOrderByCreatedAtDesc(
                        StoryApprovalStatus.pending
                )
                .stream()
                .map(story -> toStoryModerationResponse(
                        story,
                        latestActionByTarget.get(buildTargetKey(
                                ModerationActionEntity.ModerationTargetKind.story,
                                story.getId()
                        ))
                ))
                .toList();

        List<AdminPendingContentResponse> approvedStories = storyRepository.findByApprovalStatusOrderByCreatedAtDesc(
                        StoryApprovalStatus.approved
                )
                .stream()
                .map(story -> toStoryModerationResponse(
                        story,
                        latestActionByTarget.get(buildTargetKey(
                                ModerationActionEntity.ModerationTargetKind.story,
                                story.getId()
                        ))
                ))
                .toList();

        List<AdminPendingContentResponse> rejectedStories = storyRepository.findByApprovalStatusOrderByCreatedAtDesc(
                        StoryApprovalStatus.rejected
                )
                .stream()
                .map(story -> toStoryModerationResponse(
                        story,
                        latestActionByTarget.get(buildTargetKey(
                                ModerationActionEntity.ModerationTargetKind.story,
                                story.getId()
                        ))
                ))
                .toList();

        List<AdminPendingContentResponse> pendingChapters = chapterRepository.findByApprovalStatusOrderByCreatedAtDesc(
                        ChapterApprovalStatus.pending
                )
                .stream()
                .map(chapter -> toChapterModerationResponse(
                        chapter,
                        latestActionByTarget.get(buildTargetKey(
                                ModerationActionEntity.ModerationTargetKind.chapter,
                                chapter.getId()
                        ))
                ))
                .toList();

        List<AdminPendingContentResponse> approvedChapters = chapterRepository.findByApprovalStatusOrderByCreatedAtDesc(
                        ChapterApprovalStatus.approved
                )
                .stream()
                .map(chapter -> toChapterModerationResponse(
                        chapter,
                        latestActionByTarget.get(buildTargetKey(
                                ModerationActionEntity.ModerationTargetKind.chapter,
                                chapter.getId()
                        ))
                ))
                .toList();

        List<AdminPendingContentResponse> rejectedChapters = chapterRepository.findByApprovalStatusOrderByCreatedAtDesc(
                        ChapterApprovalStatus.rejected
                )
                .stream()
                .map(chapter -> toChapterModerationResponse(
                        chapter,
                        latestActionByTarget.get(buildTargetKey(
                                ModerationActionEntity.ModerationTargetKind.chapter,
                                chapter.getId()
                        ))
                ))
                .toList();

        return Stream.of(
                        pendingStories.stream(),
                        approvedStories.stream(),
                        rejectedStories.stream(),
                        pendingChapters.stream(),
                        approvedChapters.stream(),
                        rejectedChapters.stream()
                )
                .flatMap(stream -> stream)
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
        story.setApprovalStatus(StoryApprovalStatus.approved);
        story.setApprovalUpdatedAt(LocalDateTime.now());
        storyRepository.save(story);
        saveModerationAction(currentUser, "approve", ModerationActionEntity.ModerationTargetKind.story, storyId, null);
        notifyAuthorStoryModeration(story, true, null);
    }

    @Transactional
    public void rejectStoryModeration(UserEntity currentUser, Long storyId, String note) {
        requireModerator(currentUser);
        StoryEntity story = requireStoryById(storyId);
        story.setApprovalStatus(StoryApprovalStatus.rejected);
        story.setApprovalUpdatedAt(LocalDateTime.now());
        storyRepository.save(story);
        saveModerationAction(currentUser, "reject", ModerationActionEntity.ModerationTargetKind.story, storyId, note);
        notifyAuthorStoryModeration(story, false, note);
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
        chapter.setApprovalStatus(ChapterApprovalStatus.approved);
        chapter.setLastUpdateAt(LocalDateTime.now());
        chapterRepository.save(chapter);
        saveModerationAction(currentUser, "approve", ModerationActionEntity.ModerationTargetKind.chapter, chapterId, null);
        notifyAuthorChapterModeration(chapter, true, null);
    }

    @Transactional
    public void rejectChapterModeration(UserEntity currentUser, Long chapterId, String note) {
        requireModerator(currentUser);
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        chapter.setApprovalStatus(ChapterApprovalStatus.rejected);
        chapter.setLastUpdateAt(LocalDateTime.now());
        chapterRepository.save(chapter);
        saveModerationAction(currentUser, "reject", ModerationActionEntity.ModerationTargetKind.chapter, chapterId, note);
        notifyAuthorChapterModeration(chapter, false, note);
    }

    @Transactional
    public void requestChapterEditModeration(UserEntity currentUser, Long chapterId, String note) {
        requireModerator(currentUser);
        chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        saveModerationAction(currentUser, "request_edit", ModerationActionEntity.ModerationTargetKind.chapter, chapterId, note);
    }

    private AdminPendingContentResponse toStoryModerationResponse(StoryEntity story, ModerationActionEntity action) {
        String approvalStatus = story.getApprovalStatus() != null
                ? story.getApprovalStatus().name().toLowerCase()
                : null;
        String moderationStatus = action == null
                ? (approvalStatus != null ? approvalStatus : "pending")
                : resolveModerationStatus(action.getActionType());
        LocalDateTime processedAt = action != null ? action.getCreatedAt() : story.getApprovalUpdatedAt();
        return new AdminPendingContentResponse(
                story.getId(),
                "story",
                story.getId(),
                story.getTitle(),
                resolveAuthorName(story),
                resolveGenre(story),
                story.getCreatedAt(),
                moderationStatus,
                action == null ? null : action.getActionType(),
                action == null ? null : action.getNotes(),
                processedAt,
                approvalStatus
        );
    }

    private AdminPendingContentResponse toChapterModerationResponse(ChapterEntity chapter, ModerationActionEntity action) {
        StoryEntity story = chapter.getVolume().getStory();
        String approvalStatus = chapter.getApprovalStatus() != null
                ? chapter.getApprovalStatus().name().toLowerCase()
                : "pending";
        String moderationStatus = action == null
                ? approvalStatus
                : resolveModerationStatus(action.getActionType());
        LocalDateTime processedAt = action != null ? action.getCreatedAt() : chapter.getLastUpdateAt();
        return new AdminPendingContentResponse(
                chapter.getId(),
                "chapter",
                story.getId(),
                story.getTitle(),
                resolveAuthorName(story),
                resolveGenre(story),
                chapter.getCreatedAt(),
                moderationStatus,
                action == null ? null : action.getActionType(),
                action == null ? null : action.getNotes(),
                processedAt,
                approvalStatus
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

    private void notifyAuthorFollowersAboutNewStory(StoryEntity story) {
        if (story.getAuthor() == null || story.getAuthor().getId() == null) {
            return;
        }

        Long authorId = story.getAuthor().getId();
        String authorName = resolveAuthorName(story);
        String storyTitle = story.getTitle() == null || story.getTitle().isBlank()
                ? "truyện không tên"
                : story.getTitle();

        for (FollowUserEntity follow : followUserRepository.findByTargetUser_Id(authorId)) {
            if (follow.getUser() == null || follow.getUser().getId() == null || Objects.equals(follow.getUser().getId(), authorId)) {
                continue;
            }

            String message = String.format(
                    "Tác giả \"%s\" vừa có truyện mới: \"%s\".",
                    authorName,
                    storyTitle
            );

            notificationService.createNotification(
                    follow.getUser().getId(),
                    "new_story",
                    "Truyện mới",
                    message,
                    story.getId(),
                    story.getId(),
                    null
            );
        }
    }

    private void notifyAuthorStoryModeration(StoryEntity story, boolean approved, String note) {
        if (story.getAuthor() == null || story.getAuthor().getId() == null) {
            return;
        }

        String storyTitle = story.getTitle() == null || story.getTitle().isBlank()
                ? "truyện không tên"
                : story.getTitle();
        String moderationNote = note == null ? null : note.trim();

        String message = approved
                ? String.format("Truyện \"%s\" của bạn đã được duyệt.", storyTitle)
                : String.format(
                        "Truyện \"%s\" của bạn đã bị từ chối.%s",
                        storyTitle,
                        moderationNote == null || moderationNote.isBlank() ? "" : " Ghi chú từ admin: " + moderationNote
                );

        notificationService.createNotification(
                story.getAuthor().getId(),
                "story_moderation",
                approved ? "Truyện đã duyệt" : "Truyện bị từ chối",
                message,
                story.getId(),
                story.getId(),
                null
        );
    }

    private void notifyAuthorChapterModeration(ChapterEntity chapter, boolean approved, String note) {
        if (chapter.getVolume() == null || chapter.getVolume().getStory() == null) {
            return;
        }

        StoryEntity story = chapter.getVolume().getStory();
        if (story.getAuthor() == null || story.getAuthor().getId() == null) {
            return;
        }

        String storyTitle = story.getTitle() == null || story.getTitle().isBlank()
                ? "truyện không tên"
                : story.getTitle();
        String chapterTitle = chapter.getTitle() == null || chapter.getTitle().isBlank()
                ? "chương không tên"
                : chapter.getTitle();
        String moderationNote = note == null ? null : note.trim();

        String message = approved
                ? String.format(
                        "Chương \"%s\" của truyện \"%s\" của bạn đã được duyệt.",
                        chapterTitle,
                        storyTitle
                )
                : String.format(
                        "Chương \"%s\" của truyện \"%s\" của bạn đã bị từ chối.%s",
                        chapterTitle,
                        storyTitle,
                        moderationNote == null || moderationNote.isBlank() ? "" : " Ghi chú từ admin: " + moderationNote
                );

        notificationService.createNotification(
                story.getAuthor().getId(),
                "story_moderation",
                approved ? "Chương đã duyệt" : "Chương bị từ chối",
                message,
                chapter.getId(),
                story.getId(),
                chapter.getId()
        );
    }

    private String resolveAuthorName(StoryEntity story) {
        if (story.getAuthor() == null) {
            return "Unknown";
        }
        String penName = story.getAuthor().getAuthorPenName();
        if (penName != null && !penName.isBlank()) {
            return penName;
        }
        String displayName = story.getAuthor().getDisplayName();
        if (displayName != null && !displayName.isBlank()) {
            return displayName;
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

    private void requireModerator(UserEntity currentUser) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Long userId = currentUser.getId();
        boolean allowed = userId != null && (
                userRoleRepository.existsByUser_IdAndRole_Code(userId, "ADMIN")
                        || userRoleRepository.existsByUser_IdAndRole_Code(userId, "MOD")
                        || userRoleRepository.existsByUser_IdAndRole_Code(userId, "REVIEWER")
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
