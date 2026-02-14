package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChapterRepository extends JpaRepository<ChapterEntity, Long> {
    List<ChapterEntity> findAllByStatus(ChapterStatus status);
}
