package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
//<<<<<<< HEAD
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<CommentEntity, Long> {

    List<CommentEntity> findByChapter_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(Long chapterId);

    Page<CommentEntity> findByChapter_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(Long chapterId, Pageable pageable);

    Page<CommentEntity> findByStory_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(Integer storyId, Pageable pageable);

    List<CommentEntity> findByRootComment_IdInAndParentCommentIsNotNullAndIsHiddenFalseOrderByCreatedAtAsc(List<Long> rootCommentIds);

    Optional<CommentEntity> findByIdAndChapter_IdAndIsHiddenFalse(Long id, Long chapterId);

    Optional<CommentEntity> findByIdAndStory_IdAndIsHiddenFalse(Long id, Integer storyId);

    List<CommentEntity> findByParentComment_IdOrderByCreatedAtAsc(Long parentCommentId);
    
    List<CommentEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("""
            select c from CommentEntity c
            left join c.story s
            left join c.chapter ch
            left join ch.volume v
            left join v.story cs
            where c.isHidden = false
              and (
                  (s is not null and s.status = com.example.WebTruyen.entity.enums.StoryStatus.published)
                  or
                  (ch is not null
                   and ch.status = com.example.WebTruyen.entity.enums.ChapterStatus.published
                   and cs.status = com.example.WebTruyen.entity.enums.StoryStatus.published)
              )
            order by c.createdAt desc
            """)
    Page<CommentEntity> findLatestPublicRootComments(Pageable pageable);

//=======
//>>>>>>> author-create-content
}
