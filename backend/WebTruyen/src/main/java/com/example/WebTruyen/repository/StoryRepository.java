package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.enums.StoryApprovalStatus;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.enums.StoryApprovalStatus;
import com.example.WebTruyen.entity.enums.StoryCompletionStatus;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface StoryRepository extends JpaRepository<StoryEntity, Integer> {

    // Lấy story chi tiết nhưng phải thuộc author
    Optional<StoryEntity> findByIdAndAuthorId(Integer id, Long authorId);
    // Lay tu auth ID + title xem title truyen co bi trung khong
    boolean existsByAuthor_IdAndTitle(Long authorId, String title);
    
    List<StoryEntity> findByAuthor_IdOrderByCreatedAtDesc(Long authorId);

    @Query("""
            select s
            from LibraryEntryEntity le
            join le.story s
            where le.user.id = :userId
            order by le.addedAt desc
            """)
    List<StoryEntity> findLibraryStoriesByUserIdOrderByAddedAtDesc(@Param("userId") Long userId);
    
    // Query methods for published stories with sorting
    List<StoryEntity> findByStatusOrderByCreatedAtDesc(StoryStatus status);
    List<StoryEntity> findByApprovalStatusOrderByCreatedAtDesc(StoryApprovalStatus approvalStatus);
    List<StoryEntity> findByStatusOrderByCreatedAtAsc(StoryStatus status);
    List<StoryEntity> findByStatusOrderByTitleDesc(StoryStatus status);
    List<StoryEntity> findByStatusOrderByTitleAsc(StoryStatus status);

    /** Lấy truyện theo approval_status (dùng cho kiểm duyệt) */
    List<StoryEntity> findByApprovalStatusInOrderByCreatedAtDesc(List<StoryApprovalStatus> approvalStatuses);

//<<<<<<< HEAD
    // Muc dich: Dem so luot luu vao thu vien theo story de hien thi sidebar metadata. Hieuson + 10h30
    @Query(value = "select count(*) from library_entries le where le.story_id = :storyId", nativeQuery = true)
    long countLibraryEntriesByStoryId(@Param("storyId") Long storyId);

    // Muc dich: Lay danh sach id truyen cong khai de tinh xep hang theo luot xem. Hieuson + 10h30
    @Query("""
            select s.id
            from StoryEntity s
            where s.status = :status
            order by s.viewCount desc, s.createdAt desc
            """)
    List<Long> findStoryIdsByStatusOrderByViewCountDescCreatedAtDesc(
            @Param("status") StoryStatus status
    );

    // Muc dich: Lay truyen tuong tu theo tag chinh de render card sidebar. Hieuson + 10h30
    @Query("""
            select s
            from StoryEntity s
            join s.storyTags st
            where s.status = :status
              and st.tag.id = :tagId
              and s.id <> :storyId
            order by s.createdAt desc
            """)
    List<StoryEntity> findPublishedByTagExcludingStory(
            @Param("status") StoryStatus status,
            @Param("tagId") Long tagId,
            @Param("storyId") Long storyId
    );

    // Muc dich: Lay top truyen cung tac gia theo luot xem giam dan, uu tien truyen moi neu dong view. Hieuson + 10h30
    List<StoryEntity> findTop3ByAuthor_IdAndStatusAndIdNotOrderByViewCountDescCreatedAtDesc(
            Long authorId,
            StoryStatus status,
            Long excludedStoryId
    );

    @Modifying
    @Query("""
            update StoryEntity s
            set s.viewCount = s.viewCount + 1
            where s.id = :storyId
            """)
    int incrementViewCount(@Param("storyId") Long storyId);
//<<<<<<< HEAD
//=======
//    List<StoryEntity> findByAuthor_IdOrderByCreatedAtDesc(Long authorId);
//>>>>>>> origin/minhfinal1

    // Hieu Son - ngay 26/02/2026
    // Query tim kiem nang cao truyen cong khai: title, tac gia, tinh trang va danh sach tag theo dieu kien AND.
    @Query("""
            select s
            from StoryEntity s
            left join s.storyTags st
            left join s.originalAuthorUser oau
            where s.status = :status
              and (:query is null or lower(s.title) like lower(concat('%', :query, '%')))
              and (
                    :authorName is null
                    or lower(coalesce(s.author.authorPenName, s.author.username, '')) like lower(concat('%', :authorName, '%'))
                    or lower(coalesce(s.originalAuthorName, '')) like lower(concat('%', :authorName, '%'))
                    or lower(coalesce(oau.authorPenName, oau.username, '')) like lower(concat('%', :authorName, '%'))
              )
              and (:completionStatus is null or s.completionStatus = :completionStatus)
              and (:tagCount = 0 or st.tag.id in :tagIds)
            group by s
            having (:tagCount = 0 or count(distinct st.tag.id) = :tagCount)
            """)
    List<StoryEntity> findPublishedStoriesWithAdvancedFilters(
            @Param("status") StoryStatus status,
            @Param("query") String query,
            @Param("authorName") String authorName,
            @Param("completionStatus") StoryCompletionStatus completionStatus,
            @Param("tagIds") List<Long> tagIds,
            @Param("tagCount") long tagCount
    );

    /** Top truyện công khai xếp theo số lượt theo dõi (library_entries) giảm dần */
    @Query(value = """
            SELECT s.id FROM stories s
            LEFT JOIN library_entries le ON le.story_id = s.id
            WHERE s.status = 'published'
            GROUP BY s.id
            ORDER BY COUNT(le.id) DESC
            """, nativeQuery = true)
    List<Integer> findTopPublishedStoryIdsOrderByLibraryCount(Pageable pageable);

    /** Danh sách author_id phân biệt của truyện đã xuất bản */
    @Query("SELECT DISTINCT s.author.id FROM StoryEntity s WHERE s.status = :status AND s.author.id IS NOT NULL")
    List<Long> findDistinctAuthorIdsByStatus(@Param("status") StoryStatus status);
//=======
    
    long countByAuthor_Id(Long authorId);
    
//    List<StoryEntity> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
//>>>>>>> origin/portfolio
}
