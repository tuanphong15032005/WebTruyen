package com.example.WebTruyen.controller.admin;

import com.example.WebTruyen.dto.request.MergeTagsRequest;
import com.example.WebTruyen.dto.request.TagRequest;
import com.example.WebTruyen.dto.response.TagResponse;
import com.example.WebTruyen.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tags")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminTagController {

    private final TagService tagService;

    @PostMapping
    public ResponseEntity<TagResponse> createTag(@Valid @RequestBody TagRequest request) {
        TagResponse response = tagService.createTag(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TagResponse> updateTag(
            @PathVariable Long id,
            @Valid @RequestBody TagRequest request
    ) {
        TagResponse response = tagService.updateTag(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<TagResponse>> getAllTags(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TagResponse> response = tagService.getAllTags(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<List<TagResponse>> searchTags(
            @RequestParam String keyword
    ) {
        List<TagResponse> response = tagService.searchTags(keyword);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/merge")
    public ResponseEntity<Void> mergeTags(@Valid @RequestBody MergeTagsRequest request) {
        tagService.mergeTags(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unused")
    public ResponseEntity<List<TagResponse>> getUnusedTags() {
        List<TagResponse> response = tagService.getUnusedTags();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trending")
    public ResponseEntity<List<TagResponse>> getTrendingTags() {
        List<TagResponse> response = tagService.getTrendingTags();
        return ResponseEntity.ok(response);
    }
}
