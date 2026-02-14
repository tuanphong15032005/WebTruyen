package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Content.VolumeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VolumeRepository extends JpaRepository<VolumeEntity, Long> {

    List<VolumeEntity> findByStory_IdOrderBySequenceIndexAsc(Long storyId);
}
