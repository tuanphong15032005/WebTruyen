package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateTermRequest;
import com.example.WebTruyen.dto.request.UpdateTermRequest;
import com.example.WebTruyen.dto.response.TermResponse;
import com.example.WebTruyen.entity.model.Content.SitePageEntity;
import com.example.WebTruyen.repository.TermRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TermService {

    private final TermRepository termRepository;

    public List<TermResponse> getAllTerms() {
        List<SitePageEntity> terms = termRepository.findAllByOrderByIdAsc();
        return terms.stream()
                .map(this::mapToResponse)
                .toList();
    }

    public TermResponse getTermByCode(String code) {
        SitePageEntity term = termRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Term not found with code: " + code));
        return mapToResponse(term);
    }

    public void createTerm(CreateTermRequest request) {
        // Manual validation
        if (request.code() == null || request.code().trim().isEmpty()) {
            throw new RuntimeException("Code is required");
        }
        if (request.title() == null || request.title().trim().isEmpty()) {
            throw new RuntimeException("Title is required");
        }
        if (request.content() == null || request.content().trim().isEmpty()) {
            throw new RuntimeException("Content is required");
        }

        // Check if code already exists
        if (termRepository.findByCode(request.code()).isPresent()) {
            throw new RuntimeException("Term code already exists: " + request.code());
        }

        // Create and save new term using SitePageEntity
        SitePageEntity term = SitePageEntity.builder()
                .code(request.code())
                .title(request.title())
                .content(request.content())
                .build();

        termRepository.save(term);
    }

    public void updateTerm(String code, UpdateTermRequest request) {
        // Manual validation
        if (request.title() == null || request.title().trim().isEmpty()) {
            throw new RuntimeException("Title is required");
        }
        if (request.content() == null || request.content().trim().isEmpty()) {
            throw new RuntimeException("Content is required");
        }

        SitePageEntity term = termRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Term not found with code: " + code));

        // Update title and content
        term.setTitle(request.title());
        term.setContent(request.content());

        termRepository.save(term);
    }

    public void deleteTerm(String code) {
        SitePageEntity term = termRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Term not found with code: " + code));
        termRepository.delete(term);
    }

    private TermResponse mapToResponse(SitePageEntity entity) {
        return new TermResponse(
                entity.getCode(),
                entity.getTitle(),
                entity.getContent(),
                entity.getUpdatedAt()
        );
    }
}
