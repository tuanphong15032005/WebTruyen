package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.SocialLibrary.LibraryAlbumEntity;
import com.example.WebTruyen.entity.enums.LibraryAlbumVisibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LibraryAlbumRepository extends JpaRepository<LibraryAlbumEntity, Long> {

    boolean existsByUser_IdAndNameIgnoreCase(Long userId, String name);

    Optional<LibraryAlbumEntity> findByIdAndUser_Id(Long albumId, Long userId);

    Optional<LibraryAlbumEntity> findByIdAndVisibility(Long albumId, LibraryAlbumVisibility visibility);

    List<LibraryAlbumEntity> findByUser_IdOrderByUpdatedAtDesc(Long userId);

    List<LibraryAlbumEntity> findByUser_IdAndVisibilityOrderByUpdatedAtDesc(Long userId, LibraryAlbumVisibility visibility);

    List<LibraryAlbumEntity> findByUser_IdAndIdIn(Long userId, Collection<Long> ids);
}
