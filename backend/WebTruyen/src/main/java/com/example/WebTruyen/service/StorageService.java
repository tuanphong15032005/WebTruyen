package com.example.WebTruyen.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String saveCover(MultipartFile file);

    // mới: upload ảnh từ base64 data-url -> trả secure URL
    String saveBase64Image(String base64Data);
}
