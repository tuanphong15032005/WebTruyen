package com.example.WebTruyen.service;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
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

    //xu ly TH user paste inline img, khong duyet qua file picker
    @Override
    public String saveBase64Image(String base64Data) {
        if (base64Data == null || base64Data.isEmpty()) return null;
        try {
            // base64Data expected like "data:image/png;base64,iVBORw0KG..."
            String[] parts = base64Data.split(",");
            String metadata = parts[0]; // data:image/png;base64
            String payload = parts.length > 1 ? parts[1] : "";

            if (payload.isEmpty()) throw new IllegalArgumentException("Invalid base64 image data");

            byte[] bytes = Base64.getDecoder().decode(payload);
            String publicId = "webtruyen/images/" + UUID.randomUUID();

            // Cloudinary accepts InputStream via uploader().upload
            Map<?, ?> result = cloudinary.uploader().upload(
                    new ByteArrayInputStream(bytes),
                    asMap("public_id", publicId, "resource_type", "image", "overwrite", false)
            );
            Object url = result.get("secure_url");
            return url == null ? null : url.toString();
        } catch (IOException e) {
            throw new RuntimeException("Upload base64 image failed", e);
        }
    }
}
