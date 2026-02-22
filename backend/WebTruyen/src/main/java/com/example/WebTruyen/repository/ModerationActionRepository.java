package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CommentAndMod.ModerationActionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ModerationActionRepository extends JpaRepository<ModerationActionEntity, Long> {
    boolean existsByTargetKindAndTargetId(ModerationActionEntity.ModerationTargetKind targetKind, Long targetId);
    List<ModerationActionEntity> findByTargetKindInOrderByCreatedAtDesc(List<ModerationActionEntity.ModerationTargetKind> targetKinds);
}
