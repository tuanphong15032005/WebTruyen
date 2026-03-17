package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.SocialLibrary.LibraryEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LibraryEntryRepository extends JpaRepository<LibraryEntryEntity, Long> {

    List<LibraryEntryEntity> findByUser_IdOrderByAddedAtDesc(Long userId);

    Optional<LibraryEntryEntity> findByUser_IdAndStory_Id(Long userId, Long storyId);
}
