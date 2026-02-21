package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.TagDto;
import com.example.WebTruyen.entity.model.Content.TagEntity;
import com.example.WebTruyen.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;

    public List<TagDto> getAllTags() {
        List<TagEntity> tags = tagRepository.findAll();
        return tags.stream()
                .map(tag -> new TagDto(tag.getId(), tag.getName(), tag.getSlug()))
                .toList();
    }


}
