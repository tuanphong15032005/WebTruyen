package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Content.StoryReviewEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StoryReviewRepository extends JpaRepository<StoryReviewEntity, Long> {

    List<StoryReviewEntity> findByStory_IdOrderByCreatedAtDesc(Long storyId);

    Page<StoryReviewEntity> findByStory_IdOrderByCreatedAtDesc(Long storyId, Pageable pageable);

    List<StoryReviewEntity> findByStory_Id(Long storyId);

    Optional<StoryReviewEntity> findByUser_IdAndStory_Id(Long userId, Long storyId);
}
