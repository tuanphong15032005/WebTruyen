package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateLibraryAlbumRequest;
import com.example.WebTruyen.dto.request.UpdateLibraryAlbumVisibilityRequest;
import com.example.WebTruyen.dto.response.LibraryAlbumCardResponse;
import com.example.WebTruyen.dto.response.LibraryAlbumDetailResponse;
import com.example.WebTruyen.dto.response.LibraryAlbumOptionResponse;
import com.example.WebTruyen.entity.enums.LibraryAlbumVisibility;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.LibraryAlbumEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.LibraryAlbumItemEntity;
import com.example.WebTruyen.repository.LibraryAlbumRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LibraryAlbumService {

    private final LibraryAlbumRepository libraryAlbumRepository;
    private final StoryService storyService;

    @Transactional
    public LibraryAlbumOptionResponse createAlbum(UserEntity currentUser, CreateLibraryAlbumRequest req) {
        String normalizedName = normalizeName(req.name());
        String normalizedDescription = normalizeDescription(req.description());

        if (libraryAlbumRepository.existsByUser_IdAndNameIgnoreCase(currentUser.getId(), normalizedName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn đã có bộ sưu tập trùng tên");
        }

        LibraryAlbumEntity album = LibraryAlbumEntity.builder()
                .user(currentUser)
                .name(normalizedName)
                .description(normalizedDescription)
                .visibility(parseVisibility(req.visibility()))
                .build();

        LibraryAlbumEntity savedAlbum = libraryAlbumRepository.save(album);
        return new LibraryAlbumOptionResponse(
                savedAlbum.getId(),
                savedAlbum.getName(),
                savedAlbum.getDescription(),
                savedAlbum.getVisibility() != null ? savedAlbum.getVisibility().getValue() : LibraryAlbumVisibility.PRIVATE.getValue(),
                0L,
                null,
                false
        );
    }

    @Transactional
    public List<LibraryAlbumCardResponse> getAlbums(UserEntity currentUser) {
        return libraryAlbumRepository.findByUser_IdOrderByUpdatedAtDesc(currentUser.getId()).stream()
                .map(this::toCardResponse)
                .toList();
    }

    @Transactional
    public List<LibraryAlbumCardResponse> getAlbumsByUserId(Long userId) {
        return libraryAlbumRepository.findByUser_IdAndVisibilityOrderByUpdatedAtDesc(userId, com.example.WebTruyen.entity.enums.LibraryAlbumVisibility.PUBLIC).stream()
                .map(this::toCardResponse)
                .toList();
    }

    @Transactional
    public LibraryAlbumDetailResponse getAlbumDetail(UserEntity currentUser, Long albumId) {
        LibraryAlbumEntity album = libraryAlbumRepository.findByIdAndUser_Id(albumId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay bo suu tap"));

        List<LibraryAlbumItemEntity> sortedItems =
                (album.getItems() == null ? List.<LibraryAlbumItemEntity>of() : album.getItems())
                        .stream()
                        .sorted(
                                Comparator.comparing(
                                        LibraryAlbumItemEntity::getAddedAt,
                                        Comparator.nullsLast(Comparator.reverseOrder())
                                )
                        )
                        .toList();

        return new LibraryAlbumDetailResponse(
                album.getId(),
                album.getName(),
                album.getDescription(),
                album.getVisibility() != null ? album.getVisibility().getValue() : LibraryAlbumVisibility.PRIVATE.getValue(),
                (long) sortedItems.size(),
                sortedItems.stream()
                        .map(LibraryAlbumItemEntity::getStory)
                        .filter(story -> story != null)
                        .map(story -> storyService.toStoryResponse(story, false))
                        .toList()
        );
    }

    @Transactional
    public LibraryAlbumDetailResponse getPublicAlbumDetail(Long albumId) {
        LibraryAlbumEntity album = libraryAlbumRepository.findByIdAndVisibility(albumId, LibraryAlbumVisibility.PUBLIC)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay bo suu tap cong khai"));

        List<LibraryAlbumItemEntity> sortedItems =
                (album.getItems() == null ? List.<LibraryAlbumItemEntity>of() : album.getItems())
                        .stream()
                        .sorted(
                                Comparator.comparing(
                                        LibraryAlbumItemEntity::getAddedAt,
                                        Comparator.nullsLast(Comparator.reverseOrder())
                                )
                        )
                        .toList();

        return new LibraryAlbumDetailResponse(
                album.getId(),
                album.getName(),
                album.getDescription(),
                album.getVisibility() != null ? album.getVisibility().getValue() : LibraryAlbumVisibility.PUBLIC.getValue(),
                (long) sortedItems.size(),
                sortedItems.stream()
                        .map(LibraryAlbumItemEntity::getStory)
                        .filter(story -> story != null)
                        .map(story -> storyService.toStoryResponse(story, false))
                        .toList()
                );
    }

    @Transactional
    public LibraryAlbumDetailResponse updateAlbumVisibility(
            UserEntity currentUser,
            Long albumId,
            UpdateLibraryAlbumVisibilityRequest req
    ) {
        LibraryAlbumEntity album = libraryAlbumRepository.findByIdAndUser_Id(albumId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay bo suu tap"));

        album.setVisibility(parseVisibility(req.visibility()));
        LibraryAlbumEntity savedAlbum = libraryAlbumRepository.save(album);
        return getAlbumDetail(currentUser, savedAlbum.getId());
    }

    private String normalizeName(String name) {
        String value = name == null ? "" : name.trim();
        if (value.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên bộ sưu tập không được để trống");
        }
        return value;
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String value = description.trim();
        return value.isEmpty() ? null : value;
    }

    private LibraryAlbumVisibility parseVisibility(String rawVisibility) {
        if (rawVisibility == null || rawVisibility.isBlank()) {
            return LibraryAlbumVisibility.PRIVATE;
        }

        String normalized = rawVisibility.trim().toLowerCase();
        return switch (normalized) {
            case "private" -> LibraryAlbumVisibility.PRIVATE;
            case "public" -> LibraryAlbumVisibility.PUBLIC;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chế độ hiển thị bộ sưu tập không hợp lệ");
        };
    }

    private LibraryAlbumCardResponse toCardResponse(LibraryAlbumEntity album) {
        List<LibraryAlbumItemEntity> sortedItems =
                (album.getItems() == null ? List.<LibraryAlbumItemEntity>of() : album.getItems())
                        .stream()
                        .sorted(
                                Comparator.comparing(
                                        LibraryAlbumItemEntity::getAddedAt,
                                        Comparator.nullsLast(Comparator.reverseOrder())
                                )
                        )
                        .toList();

        List<LibraryAlbumItemEntity> previewItems = sortedItems.stream()
                .limit(3)
                .toList();
        long itemCount = sortedItems.size();
        long remainingCount = itemCount >= 3 ? Math.max(0, itemCount - 2) : 0;

        return new LibraryAlbumCardResponse(
                album.getId(),
                album.getName(),
                album.getDescription(),
                album.getVisibility() != null ? album.getVisibility().getValue() : LibraryAlbumVisibility.PRIVATE.getValue(),
                itemCount,
                previewItems.stream()
                        .map(LibraryAlbumItemEntity::getStory)
                        .map(story -> story != null ? story.getCoverUrl() : null)
                        .toList(),
                remainingCount
        );
    }
}
