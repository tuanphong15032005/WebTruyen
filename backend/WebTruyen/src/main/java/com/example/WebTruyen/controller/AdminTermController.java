package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.CreateTermRequest;
import com.example.WebTruyen.dto.request.UpdateTermRequest;
import com.example.WebTruyen.dto.response.TermResponse;
import com.example.WebTruyen.service.TermService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/terms")
@RequiredArgsConstructor
public class AdminTermController {

    private final TermService termService;

    @GetMapping
    public ResponseEntity<List<TermResponse>> getAllTerms() {
        List<TermResponse> terms = termService.getAllTerms();
        return ResponseEntity.ok(terms);
    }

    @GetMapping("/{code}")
    public ResponseEntity<TermResponse> getTermByCode(@PathVariable String code) {
        TermResponse term = termService.getTermByCode(code);
        return ResponseEntity.ok(term);
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createTerm(@RequestBody CreateTermRequest request) {
        termService.createTerm(request);
        return ResponseEntity.ok(Map.of("message", "Term created successfully"));
    }

    @PutMapping("/{code}")
    public ResponseEntity<Map<String, String>> updateTerm(
            @PathVariable String code,
            @RequestBody UpdateTermRequest request) {
        termService.updateTerm(code, request);
        return ResponseEntity.ok(Map.of("message", "Term updated successfully"));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Map<String, String>> deleteTerm(@PathVariable String code) {
        termService.deleteTerm(code);
        return ResponseEntity.ok(Map.of("message", "Term deleted successfully"));
    }
}
