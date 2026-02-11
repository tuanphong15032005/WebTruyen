package com.example.WebTruyen.service;
import com.example.WebTruyen.dto.request.CreateVolumeRequest;
import com.example.WebTruyen.dto.respone.CreateVolumeResponse;
import com.example.WebTruyen.dto.respone.VolumeSummaryResponse;
import com.example.WebTruyen.dto.respone.ChapterSummaryResponse;
import com.example.WebTruyen.entity.model.Content.VolumeEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.repository.VolumeRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.ChapterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

/**
 * Service xử lý business liên quan Volume (tạo, list).
 */
@Service
@RequiredArgsConstructor
public class VolumeService {

    private final StoryRepository storyRepository;
    private final VolumeRepository volumeRepository;
    private final ChapterRepository chapterRepository;

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
                    .map(c -> new ChapterSummaryResponse(
                            c.getId(),
                            c.getTitle(),
                            c.getSequenceIndex(),
                            c.getLastUpdateAt()
                    ))
                    .toList();
            result.add(new VolumeSummaryResponse(
                    volume.getId(),
                    volume.getStory().getId(),
                    volume.getTitle(),
                    volume.getSequenceIndex(),
                    chapterDtos.size(),
                    chapterDtos
            ));
        }
        return result;
    }
}
