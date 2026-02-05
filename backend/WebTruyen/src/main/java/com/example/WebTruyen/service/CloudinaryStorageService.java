package com.example.WebTruyen.service;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

import static com.cloudinary.utils.ObjectUtils.asMap;

@Service
@RequiredArgsConstructor
public class CloudinaryStorageService implements StorageService {

    private final Cloudinary cloudinary;

    @Override
    public String saveCover(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;


        try {
            String publicId = "webtruyen/covers/" + UUID.randomUUID();

            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    asMap(
                            "public_id", publicId,
                            "resource_type", "image",
                            "overwrite", false
                    )
            );

            // Cloudinary trả về secure_url
            Object url = result.get("secure_url");
            return url == null ? null : url.toString();

        } catch (IOException e) {
            throw new RuntimeException("Upload cover failed", e);
        }
    }
}
