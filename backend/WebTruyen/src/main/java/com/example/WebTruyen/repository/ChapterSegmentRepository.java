package com.example.WebTruyen.repository;
import com.example.WebTruyen.entity.model.Content.ChapterSegmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChapterSegmentRepository extends JpaRepository<ChapterSegmentEntity, Long> {

    /**
     * Lấy segments của 1 chapter theo thứ tự seq (dùng khi đọc chương hoặc khi cần rebuild preview)
     */
    List<ChapterSegmentEntity> findByChapter_IdOrderBySeqAsc(Long chapterId);

    /**
     * Xóa tất cả segments của 1 chapter (nếu xóa chapter hoặc replace content)
     */
    void deleteByChapter_Id(Long chapterId);
}
