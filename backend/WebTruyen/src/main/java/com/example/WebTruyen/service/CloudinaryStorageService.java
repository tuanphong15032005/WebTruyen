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
        
        System.out.println("=== CLOUDINARY STORAGE SERVICE ===");
        System.out.println("Original filename: " + file.getOriginalFilename());
        System.out.println("Content type: " + file.getContentType());
        System.out.println("File size: " + file.getSize() + " bytes");
        
        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Invalid file type. Only images are allowed. Content type: " + contentType);
        }
        
        // Validate file size (max 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new RuntimeException("File too large. Maximum size is 10MB. Actual size: " + file.getSize() + " bytes");
        }
        
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
            String finalUrl = url == null ? null : url.toString();
            System.out.println("Upload successful: " + finalUrl);
            return finalUrl;
        } catch (IOException e) {
            System.err.println("IO Exception during image processing: " + e.getMessage());
            throw new RuntimeException("Upload image failed: " + e.getMessage(), e);
        } catch (Exception e) {
            System.err.println("Exception during upload: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Upload image failed: " + e.getMessage(), e);
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
   //resize img using thumbailnator
    private byte[] resizeImage(byte[] input, int width, int height, boolean keepAspect) throws IOException {
        if (input == null || input.length == 0) {
            throw new IllegalArgumentException("Input image data is null or empty");
        }
        
        System.out.println("=== RESIZE IMAGE ===");
        System.out.println("Input size: " + input.length + " bytes");
        System.out.println("Target size: " + width + "x" + height);
        
        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            Thumbnails.of(new ByteArrayInputStream(input))
                    .size(width, height)
                    .keepAspectRatio(keepAspect)
                    .outputQuality(0.9)
                    .toOutputStream(output);
            
            byte[] result = output.toByteArray();
            System.out.println("Resize successful: " + result.length + " bytes");
            return result;
        } catch (net.coobird.thumbnailator.tasks.UnsupportedFormatException e) {
            System.err.println("Unsupported image format: " + e.getMessage());
            throw new RuntimeException("Unsupported image format. Please use a valid image file (JPG, PNG, GIF, WebP).", e);
        } catch (Exception e) {
            System.err.println("Error resizing image: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to process image: " + e.getMessage(), e);
        }
    }
}
