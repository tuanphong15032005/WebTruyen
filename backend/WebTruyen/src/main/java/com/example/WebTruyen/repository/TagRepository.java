package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Content.TagEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<TagEntity, Integer> {
    Optional<TagEntity> findBySlug(String slug);
    List<TagEntity> findBySlugIn(Collection<String> slugs);
}