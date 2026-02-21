package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.SocialLibrary.FollowStoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FollowStoryRepository extends JpaRepository<FollowStoryEntity, Long> {

    Optional<FollowStoryEntity> findByUser_IdAndStory_Id(Long userId, Long storyId);
}
