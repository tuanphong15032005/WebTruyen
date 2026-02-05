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
                .status(StoryStatus.valueOf(req.status() == null ? "draft" : req.status()))
                .build();
        //save
        StoryEntity saved = storyRepository.save(story);
        
        /*
        * Validate ids tag tu FE
        * Tao list of tags
        * luu list off tags cua story vao Story Repo
        * Build TagDto de reponse FE*/
        List<Long> tagIds = normalizeIds(req.tagIds());
        List<TagDto> tagDtos = List.of();

        if (!tagIds.isEmpty()) {
           /*Nếu số lượng id tồn tại != số lượng id FE gửi -> báo lỗi*/
            long existingCount = tagRepository.countByIdIn(tagIds);
            if (existingCount != tagIds.size()) {
                throw new IllegalArgumentException("Invalid tagIds: some tags do not exist");
            }

            List<TagEntity> tags = tagRepository.findAllById(tagIds);

            List<StoryTagEntity> links = new ArrayList<>(tags.size());
            for (TagEntity tag : tags) {
                StoryTagEntity st = StoryTagEntity.builder()
                        .id(new StoryTagId(saved.getId(), tag.getId())) //Composite key - check StryTagEntity
                        .story(saved)
                        .tag(tag)
                        .build();
                links.add(st);
            }
            storyTagRepository.saveAll(links);

            //Build TagDto list
            tagDtos = tags.stream()
                    .map(t -> new TagDto(t.getId(), t.getName(), t.getSlug()))
                    .toList();
        }
        // response: story + list TagDto
        return toResponse(saved, tagDtos);
    }

    //response cho controller ->  FE
    private StoryResponse toResponse(StoryEntity s, List<TagDto> tags) {
        return new StoryResponse(
                s.getId(),
                s.getAuthor().getId(),
                s.getTitle(),
                s.getSummary(),
                s.getCoverUrl(),
                s.getStatus().name(),     // enum -> String
                tags,
                s.getCreatedAt()
        );
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
