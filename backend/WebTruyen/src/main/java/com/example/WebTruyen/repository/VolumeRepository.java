package com.example.WebTruyen.repository;


// package com.example.WebTruyen.repository;
import com.example.WebTruyen.entity.model.Content.VolumeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface VolumeRepository extends JpaRepository<VolumeEntity, Long> {

    /**
     * Lấy volume theo id và đảm bảo volume thuộc storyId.
     * Sử dụng để kiểm tra route /stories/{storyId}/volumes/{volumeId}
     */
    Optional<VolumeEntity> findByIdAndStory_Id(Long id, Long storyId);

    /**
     * Lấy danh sách volume của 1 story, sắp xếp theo sequenceIndex
     */
    List<VolumeEntity> findByStory_IdOrderBySequenceIndexAsc(Long storyId);

    @Query("select coalesce(max(v.sequenceIndex), 0) from VolumeEntity v where v.story.id = :storyId")
    Integer findMaxSequenceIndexByStoryId(@Param("storyId") Long storyId);
}
