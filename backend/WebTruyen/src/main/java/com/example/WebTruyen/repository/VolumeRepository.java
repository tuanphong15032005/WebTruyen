package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Content.VolumeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VolumeRepository extends JpaRepository<VolumeEntity, Long> {

    List<VolumeEntity> findByStoryIdOrderBySequenceIndex(Long storyId);

    @Query("SELECT v FROM VolumeEntity v WHERE v.story.id = :storyId ORDER BY v.sequenceIndex")
    List<VolumeEntity> findByStoryId(@Param("storyId") Long storyId);

    Optional<VolumeEntity> findByStoryIdAndSequenceIndex(Long storyId, Integer sequenceIndex);

    boolean existsByStoryIdAndSequenceIndex(Long storyId, Integer sequenceIndex);
}
