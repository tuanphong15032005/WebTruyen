package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.SocialLibrary.LibraryEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LibraryEntryRepository extends JpaRepository<LibraryEntryEntity, Long> {

    Optional<LibraryEntryEntity> findByUser_IdAndStory_Id(Long userId, Long storyId);
}
