package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.SocialLibrary.FollowStoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FollowStoryRepository extends JpaRepository<FollowStoryEntity, Long> {

    Optional<FollowStoryEntity> findByUser_IdAndStory_Id(Long userId, Long storyId);
    long countByStory_Id(Long storyId);

    @Query("""
            select function('date', fs.createdAt), count(fs)
            from FollowStoryEntity fs
            where fs.story.id = :storyId
            group by function('date', fs.createdAt)
            order by function('date', fs.createdAt)
            """)
    List<Object[]> aggregateDailyFollowersByStoryId(@Param("storyId") Long storyId);
}
