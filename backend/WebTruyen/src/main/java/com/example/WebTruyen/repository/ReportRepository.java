package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CommentAndMod.ReportEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<ReportEntity, Long> {

    boolean existsByComment_IdAndStatusIn(Long commentId, List<ReportEntity.ReportStatus> statuses);
    long countByComment_IdAndStatusIn(Long commentId, List<ReportEntity.ReportStatus> statuses);

    List<ReportEntity> findByStatusInOrderByCreatedAtDesc(List<ReportEntity.ReportStatus> statuses);
    List<ReportEntity> findAllByOrderByCreatedAtDesc();

    long deleteByStory_Id(Long storyId);

    long deleteByChapter_Id(Long chapterId);

    long deleteByComment_Id(Long commentId);

    // Chapter report specific methods
    boolean existsByReporterAndChapterAndCreatedAtAfter(UserEntity reporter, ChapterEntity chapter, java.time.LocalDateTime since);
    long countByReporterAndCreatedAtAfter(UserEntity reporter, java.time.LocalDateTime since);
}
