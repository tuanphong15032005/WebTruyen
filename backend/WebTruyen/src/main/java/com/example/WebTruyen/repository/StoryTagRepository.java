package com.example.WebTruyen.repository;


import com.example.WebTruyen.entity.keys.StoryTagId;
import com.example.WebTruyen.entity.model.Content.StoryTagEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoryTagRepository extends JpaRepository<StoryTagEntity, StoryTagId> {

    void deleteByIdStoryId(Long storyId);

    List<StoryTagEntity> findAllByTagId(Long tagId);

    void deleteAllByTagId(Long tagId);

    long countByTagId(Long tagId);
}
