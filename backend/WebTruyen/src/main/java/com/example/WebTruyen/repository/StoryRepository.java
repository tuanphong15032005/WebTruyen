package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import org.hibernate.query.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import java.awt.print.Pageable;
import java.util.List;
import java.util.Optional;

public interface StoryRepository extends JpaRepository<StoryEntity, Integer> {

    // Lấy story chi tiết nhưng phải thuộc author
    Optional<StoryEntity> findByIdAndAuthorId(Integer id, Long authorId);
    // Lay tu auth ID + title xem title truyen co bi trung khong
    boolean existsByAuthor_IdAndTitle(Long authorId, String title);
    
    // Query methods for published stories with sorting
    List<StoryEntity> findByStatusOrderByCreatedAtDesc(StoryStatus status);
    List<StoryEntity> findByStatusOrderByCreatedAtAsc(StoryStatus status);
    List<StoryEntity> findByStatusOrderByTitleDesc(StoryStatus status);
    List<StoryEntity> findByStatusOrderByTitleAsc(StoryStatus status);
}
