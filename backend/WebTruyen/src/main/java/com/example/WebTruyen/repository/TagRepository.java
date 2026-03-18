package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Content.TagEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<TagEntity, Long> {

    Optional<TagEntity> findBySlug(String slug);

    List<TagEntity> findBySlugIn(Collection<String> slugs);

    long countByIdIn(Collection<Long> tagIds);

    List<TagEntity> findByIdIn(Collection<Long> ids);

    List<TagEntity> findByNameContainingIgnoreCase(String name);

    @Query("SELECT t FROM TagEntity t WHERE t.id NOT IN (SELECT DISTINCT st.tag.id FROM StoryTagEntity st)")
    List<TagEntity> findUnusedTags();

    @Query("SELECT t FROM TagEntity t JOIN StoryTagEntity st ON t.id = st.tag.id GROUP BY t.id ORDER BY COUNT(st.tag.id) DESC")
    List<TagEntity> findTrendingTags();

    Page<TagEntity> findAll(Pageable pageable);
}
