package com.example.WebTruyen.controller;

import com.example.WebTruyen.entity.model.Content.SitePageEntity;
import com.example.WebTruyen.service.SitePageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SitePageController {
    
    private final SitePageService sitePageService;
    
    private int extractNumberSimple(String code) {
        for (int i = 0; i < code.length(); i++) {
            char c = code.charAt(i);
            if (Character.isDigit(c)) {
                int num = 0;
                while (i < code.length() && Character.isDigit(code.charAt(i))) {
                    num = num * 10 + (code.charAt(i) - '0');
                    i++;
                }
                return num;
            }
        }
        return 0;
    }
    
    @GetMapping("/public/pages/{code}")
    public ResponseEntity<List<SitePageEntity>> getPagesByCode(@PathVariable String code) {
        // Handle base codes like 'terms', 'privacy', 'author-rules'
        // and return all related blocks
        List<SitePageEntity> allPages = sitePageService.findAll(); // Temporarily use findAll()
        
        System.out.println("=== DEBUG: All pages order ===");
        allPages.forEach(page -> System.out.println("  " + page.getCode() + " - " + page.getTitle()));
        
        List<SitePageEntity> filteredPages = allPages.stream()
            .filter(page -> {
                String pageCode = page.getCode();
                if (code.equals("terms")) {
                    return pageCode.startsWith("term");
                } else if (code.equals("privacy")) {
                    return pageCode.startsWith("privacy");
                } else if (code.equals("author-rules")) {
                    return pageCode.startsWith("author-rules");
                } else {
                    return pageCode.equals(code);
                }
            })
            .sorted((a, b) -> {
                // Sort by code numerically (term1, term2, ..., term10)
                String aCode = a.getCode();
                String bCode = b.getCode();
                
                // Extract numbers using simple method
                int aNum = extractNumberSimple(aCode);
                int bNum = extractNumberSimple(bCode);
                
                return Integer.compare(aNum, bNum);
            })
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(filteredPages);
    }
    
    @GetMapping("/public/pages")
    public ResponseEntity<List<SitePageEntity>> getAllPagesPublic() {
        List<SitePageEntity> pages = sitePageService.findAll();
        return ResponseEntity.ok(pages);
    }
    
    @GetMapping("/admin/pages")
    public ResponseEntity<List<SitePageEntity>> getAllPages() {
        return ResponseEntity.ok(sitePageService.findAll());
    }
    
    @PostMapping("/admin/pages")
    public ResponseEntity<SitePageEntity> createPage(@RequestBody SitePageEntity sitePage) {
        return ResponseEntity.ok(sitePageService.save(sitePage));
    }
    
    @PutMapping("/admin/pages/{id}")
    public ResponseEntity<SitePageEntity> updatePage(@PathVariable Long id, @RequestBody SitePageEntity sitePage) {
        sitePage.setId(id);
        return ResponseEntity.ok(sitePageService.save(sitePage));
    }
    
    @DeleteMapping("/admin/pages/{id}")
    public ResponseEntity<Void> deletePage(@PathVariable Long id) {
        sitePageService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
