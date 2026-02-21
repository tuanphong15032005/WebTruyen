package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.TagDto;
import com.example.WebTruyen.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping({"/tags", "/v1/tags"})
    public List<TagDto> getTags() {
        return tagService.getAllTags();
    }
}
