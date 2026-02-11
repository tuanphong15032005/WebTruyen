package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateStoryRequest;
import com.example.WebTruyen.dto.respone.StoryResponse;
import com.example.WebTruyen.dto.respone.TagDto;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.keys.StoryTagId;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.Content.StoryTagEntity;
import com.example.WebTruyen.entity.model.Content.TagEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.StoryTagRepository;
import com.example.WebTruyen.repository.TagRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.*;

@Service
@RequiredArgsConstructor
public class StoryService {
    @Autowired
    private final StoryRepository storyRepository;
    private final TagRepository tagRepository;
    private final StoryTagRepository storyTagRepository;
    private final StorageService storageService;



    @Transactional
    public StoryResponse createStory(UserEntity currentUser, CreateStoryRequest req, MultipartFile cover) {
        //Validate
        if (req.title() == null || req.title().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        if (storyRepository.existsByAuthor_IdAndTitle(currentUser.getId(), req.title().trim())) {

        }

        //Upload cover
        String coverUrl = null;
        if (cover != null && !cover.isEmpty()) {
            coverUrl = storageService.saveCover(cover); //cloud return url cua cover.
        }

        // Save story
        StoryEntity story = StoryEntity.builder()
                .author(currentUser)
                .title(req.title().trim())
                .summary(req.summaryHtml())
                .coverUrl(coverUrl)
                .status(resolveStatus(req))
                .build();
        //save
        StoryEntity saved = storyRepository.save(story);
        
        List<TagDto> tagDtos = syncStoryTags(saved, normalizeIds(req.tagIds()), true);
        // response: story + list TagDto
        return toResponse(saved, tagDtos);
    }

    // Lấy chi tiết truyện theo id
    @Transactional
    public StoryResponse getStoryById(Integer storyId) {
        StoryEntity story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));

        List<TagDto> tagDtos = story.getStoryTags().stream()
                .map(StoryTagEntity::getTag)
                .filter(Objects::nonNull)
                .map(t -> new TagDto(t.getId(), t.getName(), t.getSlug()))
                .toList();

        return toResponse(story, tagDtos);
    }

    // C?p nh?t truy?n theo id (kh?ng t?o m?i)
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

        if (cover != null && !cover.isEmpty()) {
            String coverUrl = storageService.saveCover(cover);
            story.setCoverUrl(coverUrl);
        }

        StoryEntity saved = storyRepository.save(story);
        List<TagDto> tagDtos = syncStoryTags(saved, normalizeIds(req.tagIds()), true);
        return toResponse(saved, tagDtos);
    }

    //response cho controller ->  FE
    private StoryResponse toResponse(StoryEntity s, List<TagDto> tags) {
        return new StoryResponse(
                s.getId(),
                s.getAuthor().getId(),
                s.getAuthor().getAuthorPenName(),
                s.getTitle(),
                s.getSummary(),
                s.getCoverUrl(),
                s.getStatus().name(),     // enum -> String
                tags,
                s.getCreatedAt()
        );
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

}
