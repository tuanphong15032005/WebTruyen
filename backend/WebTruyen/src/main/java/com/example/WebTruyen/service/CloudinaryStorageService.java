package com.example.WebTruyen.service;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import static com.cloudinary.utils.ObjectUtils.asMap;

@Service
@RequiredArgsConstructor
public class CloudinaryStorageService implements StorageService {

    private static final int COVER_WIDTH = 600;
    private static final int COVER_HEIGHT = 800;
    private static final int IMAGE_MAX_SIZE = 1200;

    private final Cloudinary cloudinary;

    @Override
    public String saveCover(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        try {
            byte[] resized = resizeImage(file.getBytes(), COVER_WIDTH, COVER_HEIGHT, true);
            String publicId = "webtruyen/covers/" + UUID.randomUUID();
            Map<?, ?> result = cloudinary.uploader().upload(
                    resized,
                    asMap(
                            "public_id", publicId,
                            "resource_type", "image",
                            "overwrite", false
                    )
            );
            Object url = result.get("secure_url");
            return url == null ? null : url.toString();
        } catch (IOException e) {
            throw new RuntimeException("Upload cover failed", e);
        }
    }

    @Override
    public String saveImage(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        try {
            byte[] resized = resizeImage(file.getBytes(), IMAGE_MAX_SIZE, IMAGE_MAX_SIZE, true);
            String publicId = "webtruyen/images/" + UUID.randomUUID();
            Map<?, ?> result = cloudinary.uploader().upload(
                    resized,
                    asMap(
                            "public_id", publicId,
                            "resource_type", "image",
                            "overwrite", false
                    )
            );
            Object url = result.get("secure_url");
            return url == null ? null : url.toString();
        } catch (IOException e) {
            throw new RuntimeException("Upload image failed", e);
        }
    }

    @Override
    public String saveBase64Image(String base64Data) {
        if (base64Data == null || base64Data.isEmpty()) return null;
        try {
            String[] parts = base64Data.split(",");
            String payload = parts.length > 1 ? parts[1] : "";
            if (payload.isEmpty()) throw new IllegalArgumentException("Invalid base64 image data");

            byte[] bytes = Base64.getDecoder().decode(payload);
            byte[] resized = resizeImage(bytes, IMAGE_MAX_SIZE, IMAGE_MAX_SIZE, true);
            String publicId = "webtruyen/images/" + UUID.randomUUID();
            Map<?, ?> result = cloudinary.uploader().upload(
                    new ByteArrayInputStream(resized),
                    asMap("public_id", publicId, "resource_type", "image", "overwrite", false)
            );
            Object url = result.get("secure_url");
            return url == null ? null : url.toString();
        } catch (IOException e) {
            throw new RuntimeException("Upload base64 image failed", e);
        }
    }

    private byte[] resizeImage(byte[] input, int width, int height, boolean keepAspect) throws IOException {
        if (input == null || input.length == 0) return input;
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Thumbnails.of(new ByteArrayInputStream(input))
                .size(width, height)
                .keepAspectRatio(keepAspect)
                .outputQuality(0.9)
                .toOutputStream(output);
        return output.toByteArray();
    }
}
