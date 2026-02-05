package com.example.WebTruyen.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String saveCover(MultipartFile file);
}
