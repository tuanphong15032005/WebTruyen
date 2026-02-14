package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StoryRepository extends JpaRepository<StoryEntity, Long> {
    List<StoryEntity> findAllByStatus(StoryStatus status);
}
