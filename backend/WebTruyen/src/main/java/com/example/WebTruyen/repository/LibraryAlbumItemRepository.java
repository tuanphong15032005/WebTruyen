package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.keys.LibraryAlbumItemId;
import com.example.WebTruyen.entity.model.SocialLibrary.LibraryAlbumItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LibraryAlbumItemRepository extends JpaRepository<LibraryAlbumItemEntity, LibraryAlbumItemId> {

    boolean existsByAlbum_IdAndStory_Id(Long albumId, Long storyId);

    @Modifying
    @Query("""
            delete from LibraryAlbumItemEntity item
            where item.album.id = :albumId
              and item.story.id = :storyId
            """)
    int deleteFromAlbum(@Param("albumId") Long albumId, @Param("storyId") Long storyId);

    @Modifying
    @Query("""
            delete from LibraryAlbumItemEntity item
            where item.album.user.id = :userId
              and item.story.id = :storyId
            """)
    int deleteAllForUserStory(@Param("userId") Long userId, @Param("storyId") Long storyId);
}
