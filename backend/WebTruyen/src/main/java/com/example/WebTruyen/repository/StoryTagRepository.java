package com.example.WebTruyen.repository;


import com.example.WebTruyen.entity.keys.StoryTagId;
import com.example.WebTruyen.entity.model.Content.StoryTagEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoryTagRepository extends JpaRepository<StoryTagEntity, StoryTagId> {

    void deleteByIdStoryId(Integer storyId);
}
