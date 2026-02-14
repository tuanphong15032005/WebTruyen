package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CommentAndMod.ModerationActionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModerationActionRepository extends JpaRepository<ModerationActionEntity, Long> {
}
