package com.example.WebTruyen.service;
import com.example.WebTruyen.dto.request.CreateVolumeRequest;
import com.example.WebTruyen.dto.response.CreateVolumeResponse;
import com.example.WebTruyen.dto.response.VolumeSummaryResponse;
import com.example.WebTruyen.dto.response.ChapterSummaryResponse;
import com.example.WebTruyen.entity.enums.ChapterApprovalStatus;
import com.example.WebTruyen.entity.model.CommentAndMod.ModerationActionEntity;
import com.example.WebTruyen.entity.model.Content.VolumeEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.repository.ModerationActionRepository;
import com.example.WebTruyen.repository.VolumeRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.ChapterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service xử lý business liên quan Volume (tạo, list).
 */
@Service
@RequiredArgsConstructor
public class VolumeService {
    private static final Duration APPROVAL_RESUBMIT_COOLDOWN = Duration.ofHours(24);

    private final StoryRepository storyRepository;
    private final VolumeRepository volumeRepository;
    private final ChapterRepository chapterRepository;
    private final ModerationActionRepository moderationActionRepository;
    private final StorageService storageService;

    /**
     * Tạo volume mới cho story. Chỉ author (owner) của story mới được thực hiện.
     *
     * Steps:
     * 1. Kiểm tra story tồn tại và thuộc về currentUser (ownership).
     * 2. Tạo VolumeEntity và lưu vào DB.
     * 3. Trả về DTO chứa id, title, sequenceIndex.
     */
    @Transactional
    public CreateVolumeResponse createVolume(UserEntity currentUser, Integer storyId, CreateVolumeRequest req) {
        // 1) Lấy story và kiểm tra quyền sở hữu
        StoryEntity story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));


        Long authorId = story.getAuthor() != null ? story.getAuthor().getId() : null;
        if (authorId == null || !authorId.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not the owner of this story");
        }

        // 2) Build và save volume
        Integer nextIndex = req.getSequenceIndex();
        if (nextIndex == null || nextIndex <= 0) {
            Integer maxIndex = volumeRepository.findMaxSequenceIndexByStoryId(story.getId());
            nextIndex = (maxIndex == null ? 0 : maxIndex) + 1;
        }
        VolumeEntity volume = VolumeEntity.builder()
                .story(story)
                .title(req.getTitle())
                .sequenceIndex(nextIndex)
                .createdAt(java.time.LocalDateTime.now())
                .build();

        VolumeEntity saved = volumeRepository.save(volume);

        // 3) prepare response DTO
        CreateVolumeResponse resp = new CreateVolumeResponse();
        resp.setId(saved.getId());
        resp.setStoryId(saved.getStory().getId());
        resp.setTitle(saved.getTitle());
        resp.setCoverUrl(saved.getCoverUrl());
        resp.setSequenceIndex(saved.getSequenceIndex());
        return resp;
    }

    /*
    * */
    @Transactional
    public CreateVolumeResponse updateVolumeTitle(
            UserEntity currentUser,
            Long storyId,
            Long volumeId,
            CreateVolumeRequest req
    ) {
      //
        VolumeEntity volume = volumeRepository.findByIdAndStory_Id(volumeId, storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Volume not found"));
        StoryEntity story = volume.getStory();

        Long authorId = story != null && story.getAuthor() != null ? story.getAuthor().getId() : null;
        if (authorId == null || !authorId.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not the owner of this story");
        }

        String nextTitle = req != null && req.getTitle() != null ? req.getTitle().trim() : "";
        if (nextTitle.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Volume title is required");
        }

        volume.setTitle(nextTitle);
        VolumeEntity saved = volumeRepository.save(volume);

        CreateVolumeResponse resp = new CreateVolumeResponse();
        resp.setId(saved.getId());
        resp.setStoryId(saved.getStory().getId());
        resp.setTitle(saved.getTitle());
        resp.setCoverUrl(saved.getCoverUrl());
        resp.setSequenceIndex(saved.getSequenceIndex());
        return resp;
    }

    @Transactional
    public CreateVolumeResponse updateVolumeCover(
            UserEntity currentUser,
            Long storyId,
            Long volumeId,
            MultipartFile cover
    ) {
        if (cover == null || cover.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Volume cover is required");
        }

        VolumeEntity volume = volumeRepository.findByIdAndStory_Id(volumeId, storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Volume not found"));
        StoryEntity story = volume.getStory();

        Long authorId = story != null && story.getAuthor() != null ? story.getAuthor().getId() : null;
        if (authorId == null || !authorId.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not the owner of this story");
        }

        String coverUrl = storageService.saveCover(cover);
        if (coverUrl == null || coverUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Upload volume cover failed");
        }

        volume.setCoverUrl(coverUrl);
        VolumeEntity saved = volumeRepository.save(volume);

        CreateVolumeResponse resp = new CreateVolumeResponse();
        resp.setId(saved.getId());
        resp.setStoryId(saved.getStory().getId());
        resp.setTitle(saved.getTitle());
        resp.setCoverUrl(saved.getCoverUrl());
        resp.setSequenceIndex(saved.getSequenceIndex());
        return resp;
    }

    // Lấy danh sách volume và chapter theo story
    @Transactional(readOnly = true)
    public List<VolumeSummaryResponse> listVolumesWithChapters(Long storyId) {
        List<VolumeEntity> volumes = volumeRepository.findByStory_IdOrderBySequenceIndexAsc(storyId);
        List<VolumeSummaryResponse> result = new java.util.ArrayList<>();
        for (VolumeEntity volume : volumes) {
            List<ChapterEntity> chapters = chapterRepository.findByVolume_IdOrderBySequenceIndexAsc(volume.getId());
            List<ChapterSummaryResponse> chapterDtos = chapters.stream()
                    .map(this::toAuthorChapterSummaryResponse)
                    .toList();
            result.add(new VolumeSummaryResponse(
                    volume.getId(),
                    volume.getStory().getId(),
                    volume.getTitle(),
                    volume.getCoverUrl(),
                    volume.getSequenceIndex(),
                    chapterDtos.size(),
                    chapterDtos
            ));
        }
        return result;
    }

    // Lấy danh sách volume/chapter public cho độc giả (chỉ published story + published chapter).
    @Transactional(readOnly = true)
    public List<VolumeSummaryResponse> listPublishedVolumesWithPublishedChapters(Long storyId) {
        StoryEntity story = storyRepository.findById(Math.toIntExact(storyId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
        if (story.getStatus() != StoryStatus.published) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Story is not public");
        }

        List<VolumeEntity> volumes = volumeRepository.findByStory_IdOrderBySequenceIndexAsc(storyId);
        List<VolumeSummaryResponse> result = new java.util.ArrayList<>();
        for (VolumeEntity volume : volumes) {
            List<ChapterEntity> chapters = chapterRepository.findByVolume_IdOrderBySequenceIndexAsc(volume.getId());
            List<ChapterSummaryResponse> chapterDtos = chapters.stream()
                    .filter(c -> c.getStatus() != null && "published".equalsIgnoreCase(c.getStatus().name()))
                    .map(c -> new ChapterSummaryResponse(
                            c.getId(),
                            c.getTitle(),
                            c.getSequenceIndex(),
                            c.getLastUpdateAt(),
                            c.getStatus().name(),
                            c.getApprovalStatus() != null ? c.getApprovalStatus().name() : null,
                            null,
                            null,
                            null
                    ))
                    .toList();
            if (chapterDtos.isEmpty()) {
                continue;
            }
            result.add(new VolumeSummaryResponse(
                    volume.getId(),
                    volume.getStory().getId(),
                    volume.getTitle(),
                    volume.getCoverUrl(),
                    volume.getSequenceIndex(),
                    chapterDtos.size(),
                    chapterDtos
            ));
        }
        return result;
    }

    private ChapterSummaryResponse toAuthorChapterSummaryResponse(ChapterEntity chapter) {
        ModerationActionEntity latestAction = resolveLatestModerationAction(chapter.getId());
        ChapterApprovalStatus rawApprovalStatus = chapter.getApprovalStatus();
        ChapterApprovalStatus effectiveApprovalStatus = resolveEffectiveApprovalStatus(
                rawApprovalStatus,
                chapter.getLastUpdateAt()
        );
        String moderationNote = resolveRejectedModerationNote(rawApprovalStatus, latestAction);
        LocalDateTime resubmitAvailableAt = computeResubmitAvailableAt(chapter.getLastUpdateAt());
        Long resubmitHoursRemaining = rawApprovalStatus == ChapterApprovalStatus.rejected
                ? computeResubmitHoursRemaining(chapter.getLastUpdateAt())
                : null;

        return new ChapterSummaryResponse(
                chapter.getId(),
                chapter.getTitle(),
                chapter.getSequenceIndex(),
                chapter.getLastUpdateAt(),
                chapter.getStatus() != null ? chapter.getStatus().name() : null,
                effectiveApprovalStatus != null ? effectiveApprovalStatus.name() : null,
                moderationNote,
                resubmitAvailableAt,
                resubmitHoursRemaining
        );
    }

    private ModerationActionEntity resolveLatestModerationAction(Long chapterId) {
        if (chapterId == null) {
            return null;
        }
        return moderationActionRepository
                .findTopByTargetKindAndTargetIdOrderByCreatedAtDesc(
                        ModerationActionEntity.ModerationTargetKind.chapter,
                        chapterId
                )
                .orElse(null);
    }

    private ChapterApprovalStatus resolveEffectiveApprovalStatus(
            ChapterApprovalStatus approvalStatus,
            LocalDateTime lastUpdateAt
    ) {
        if (approvalStatus == ChapterApprovalStatus.rejected
                && computeResubmitHoursRemaining(lastUpdateAt) == 0L) {
            return null;
        }
        return approvalStatus;
    }

    private String resolveRejectedModerationNote(
            ChapterApprovalStatus approvalStatus,
            ModerationActionEntity action
    ) {
        if (approvalStatus != ChapterApprovalStatus.rejected || action == null) {
            return null;
        }
        String actionType = action.getActionType() == null ? "" : action.getActionType().trim().toLowerCase();
        if (!actionType.contains("reject")) {
            return null;
        }
        String note = action.getNotes();
        return note == null || note.isBlank() ? null : note.trim();
    }

    private LocalDateTime computeResubmitAvailableAt(LocalDateTime lastUpdateAt) {
        if (lastUpdateAt == null) {
            return null;
        }
        return lastUpdateAt.plus(APPROVAL_RESUBMIT_COOLDOWN);
    }

    private long computeResubmitHoursRemaining(LocalDateTime lastUpdateAt) {
        LocalDateTime availableAt = computeResubmitAvailableAt(lastUpdateAt);
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
}
