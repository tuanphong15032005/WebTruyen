package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.MergeTagsRequest;
import com.example.WebTruyen.dto.request.TagRequest;
import com.example.WebTruyen.dto.response.TagResponse;
import com.example.WebTruyen.entity.model.Content.StoryTagEntity;
import com.example.WebTruyen.entity.model.Content.TagEntity;
import com.example.WebTruyen.exception.ResourceNotFoundException;
import com.example.WebTruyen.exception.DuplicateResourceException;
import com.example.WebTruyen.repository.StoryTagRepository;
import com.example.WebTruyen.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TagService {

    private final TagRepository tagRepository;
    private final StoryTagRepository storyTagRepository;

    private String generateSlug(String name) {
        // Chuyển tiếng Việt có dấu về không dấu
        String normalized = java.text.Normalizer.normalize(name.toLowerCase(), java.text.Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        
        return normalized
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    public TagResponse createTag(TagRequest request) {
        // Check for exact name match
        List<TagEntity> existingTags = tagRepository.findAll();
        boolean nameExists = existingTags.stream()
                .anyMatch(tag -> tag.getName().equalsIgnoreCase(request.getName()));
        
        if (nameExists) {
            throw new DuplicateResourceException("Tag with name '" + request.getName() + "' already exists");
        }

        String slug = generateSlug(request.getName());
        if (tagRepository.findBySlug(slug).isPresent()) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        TagEntity tag = TagEntity.builder()
                .name(request.getName())
                .slug(slug)
                .build();

        TagEntity savedTag = tagRepository.save(tag);
        return mapToResponse(savedTag);
    }

    public TagResponse updateTag(Long id, TagRequest request) {
        TagEntity tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found with id: " + id));

        if (!tag.getName().equals(request.getName())) {
            // Check for exact name match (excluding current tag)
            List<TagEntity> existingTags = tagRepository.findAll();
            boolean nameExists = existingTags.stream()
                    .anyMatch(t -> t.getName().equalsIgnoreCase(request.getName()) && !t.getId().equals(id));
            
            if (nameExists) {
                throw new DuplicateResourceException("Tag with name '" + request.getName() + "' already exists");
            }

            String newSlug = generateSlug(request.getName());
            if (!tag.getSlug().equals(newSlug) && tagRepository.findBySlug(newSlug).isPresent()) {
                newSlug = newSlug + "-" + System.currentTimeMillis();
            }

            tag.setName(request.getName());
            tag.setSlug(newSlug);
        }

        TagEntity savedTag = tagRepository.save(tag);
        return mapToResponse(savedTag);
    }

    public void deleteTag(Long id) {
        TagEntity tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found with id: " + id));

        storyTagRepository.deleteAllByTagId(id);
        tagRepository.delete(tag);
    }

    @Transactional(readOnly = true)
    public Page<TagResponse> getAllTags(Pageable pageable) {
        return tagRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<TagResponse> searchTags(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return List.of();
        }

        return tagRepository.findByNameContainingIgnoreCase(keyword)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TagResponse> getUnusedTags() {
        return tagRepository.findUnusedTags()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TagResponse> getTrendingTags() {
        return tagRepository.findTrendingTags()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void mergeTags(MergeTagsRequest request) {
        if (request.getSourceTagId().equals(request.getTargetTagId())) {
            throw new IllegalArgumentException("Source and target tags cannot be the same");
        }

        TagEntity sourceTag = tagRepository.findById(request.getSourceTagId())
                .orElseThrow(() -> new ResourceNotFoundException("Source tag not found with id: " + request.getSourceTagId()));

        TagEntity targetTag = tagRepository.findById(request.getTargetTagId())
                .orElseThrow(() -> new ResourceNotFoundException("Target tag not found with id: " + request.getTargetTagId()));

        List<StoryTagEntity> storyTags = storyTagRepository.findAllByTagId(request.getSourceTagId());
        
        for (StoryTagEntity storyTag : storyTags) {
            StoryTagEntity newStoryTag = StoryTagEntity.builder()
                    .story(storyTag.getStory())
                    .tag(targetTag)
                    .build();
            storyTagRepository.save(newStoryTag);
        }

        storyTagRepository.deleteAllByTagId(request.getSourceTagId());
        tagRepository.delete(sourceTag);
    }

    private TagResponse mapToResponse(TagEntity tag) {
        long usageCount = storyTagRepository.countByTagId(tag.getId());
        return new TagResponse(
                tag.getId(),
                tag.getName(),
                tag.getSlug(),
                false,
                usageCount
        );
    }

    public List<com.example.WebTruyen.dto.response.TagDto> getAllTags() {
        List<TagEntity> tags = tagRepository.findAll();
        return tags.stream()
                .map(tag -> new com.example.WebTruyen.dto.response.TagDto(tag.getId(), tag.getName(), tag.getSlug()))
                .toList();
    }
}
