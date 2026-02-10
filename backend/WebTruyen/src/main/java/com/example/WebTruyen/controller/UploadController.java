package com.example.WebTruyen.controller;


import com.example.WebTruyen.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final StorageService storageService;

    /**
     * Upload image file (from file picker). Trả về JSON { "url": "https://..." }
     * FE sẽ chèn URL vào Quill bằng quill.insertEmbed(index, 'image', url)
     * FE gọi endpoint này khi user chọn file.
     */
    @PostMapping("/image")
    public Map<String, String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String url = storageService.saveCover(file);
            if (url == null) throw new RuntimeException("Upload returned null url");
            return Collections.singletonMap("url", url);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Image upload failed", ex);
        }
    }
}
