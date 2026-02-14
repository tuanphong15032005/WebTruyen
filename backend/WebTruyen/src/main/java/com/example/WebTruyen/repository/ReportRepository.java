package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CommentAndMod.ReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<ReportEntity, Long> {

    boolean existsByComment_IdAndStatusIn(Long commentId, List<ReportEntity.ReportStatus> statuses);
}
