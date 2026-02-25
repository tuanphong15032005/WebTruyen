package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CommentAndMod.ReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

//<<<<<<< HEAD
//public interface ReportRepository extends JpaRepository<ReportEntity, Long> {
//=======
import java.util.List;

public interface ReportRepository extends JpaRepository<ReportEntity, Long> {

    boolean existsByComment_IdAndStatusIn(Long commentId, List<ReportEntity.ReportStatus> statuses);
    long countByComment_IdAndStatusIn(Long commentId, List<ReportEntity.ReportStatus> statuses);

    List<ReportEntity> findByStatusInOrderByCreatedAtDesc(List<ReportEntity.ReportStatus> statuses);
    List<ReportEntity> findAllByOrderByCreatedAtDesc();

    long deleteByStory_Id(Long storyId);

    long deleteByChapter_Id(Long chapterId);

    long deleteByComment_Id(Long commentId);
//>>>>>>> origin/minhfinal1
}
