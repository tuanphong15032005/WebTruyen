package com.example.WebTruyen.service;
import com.example.WebTruyen.dto.request.CreateVolumeRequest;
import com.example.WebTruyen.dto.respone.CreateVolumeResponse;
import com.example.WebTruyen.entity.model.Content.VolumeEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.repository.VolumeRepository;
import com.example.WebTruyen.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/**
 * Service xử lý business liên quan Volume (tạo, list).
 */
@Service
@RequiredArgsConstructor
public class VolumeService {

    private final StoryRepository storyRepository;
    private final VolumeRepository volumeRepository;

    /**
     * Tạo volume mới cho story. Chỉ author (owner) của story mới được thực hiện.
     *
     * Steps:
     * 1. Kiểm tra story tồn tại và thuộc về currentUser (ownership).
     * 2. Tạo VolumeEntity và lưu vào DB.
     * 3. Trả về DTO chứa id, title, sequenceIndex.
     *
     * @param currentUser user đang đăng nhập (tác giả)
     * @param storyId story id mà volume thuộc về
     * @param req thông tin tạo volume
     * @return CreateVolumeResponse
     */
    @Transactional
    public CreateVolumeResponse createVolume(UserEntity currentUser, Integer storyId, CreateVolumeRequest req) {
        // 1) Lấy story và kiểm tra quyền sở hữu
        StoryEntity story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));

        // assume StoryEntity có getAuthor().getId()
        Long authorId = story.getAuthor() != null ? story.getAuthor().getId() : null;
        if (authorId == null || !authorId.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not the owner of this story");
        }

        // 2) Build và save volume
        VolumeEntity volume = VolumeEntity.builder()
                .story(story)
                .title(req.getTitle())
                .sequenceIndex(req.getSequenceIndex() == null ? 0 : req.getSequenceIndex())
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
}
