package com.example.WebTruyen.repository;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChapterRepository extends JpaRepository<ChapterEntity, Long> {

    /**
     * Lấy chapter theo id và kiểm tra thuộc volumeId.
     * Dùng để đảm bảo endpoint /volumes/{volumeId}/chapters/{chapterId}
     */
    Optional<ChapterEntity> findByIdAndVolume_Id(Long id, Long volumeId);

    /**
     * Lấy danh sách chapter theo volume, sắp xếp theo sequenceIndex
     */
    List<ChapterEntity> findByVolume_IdOrderBySequenceIndexAsc(Long volumeId);

    /**
     * Kiểm tra tồn tại chapter cùng sequenceIndex trong volume (tránh trùng thứ tự)
     */
    boolean existsByVolume_IdAndSequenceIndex(Long volumeId, Integer sequenceIndex);
}
