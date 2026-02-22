
package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateCommentRequest;
import com.example.WebTruyen.dto.response.AuthorChapterOptionResponse;
import com.example.WebTruyen.dto.response.AuthorCommentResponse;
import com.example.WebTruyen.dto.response.AuthorStoryOptionResponse;
import com.example.WebTruyen.dto.response.CommentResponse;
import com.example.WebTruyen.dto.response.PagedResponse;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import com.example.WebTruyen.entity.model.CommentAndMod.ReportEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.CommentRepository;
import com.example.WebTruyen.repository.ReportRepository;
import com.example.WebTruyen.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final CommentRepository commentRepository;
    private final ReportRepository reportRepository;

    // =========================================================================
    // PHẦN 1: LOGIC TỪ NHÁNH author-create-content (API, DTO, Pagination)
    // =========================================================================

    @Transactional(readOnly = true)
    public PagedResponse<CommentResponse> listPublishedChapterComments(
            Integer storyId,
            Long chapterId,
            Integer page,
            Integer size
    ) {
        ChapterEntity chapter = requirePublishedChapter(storyId, chapterId);
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);

        Page<CommentEntity> dataPage = commentRepository
                .findByChapter_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(
                        chapter.getId(),
                        PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))
                );

        return buildPagedResponse(dataPage, safePage, safeSize);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CommentResponse> listPublishedStoryComments(
            Integer storyId,
            Integer page,
            Integer size
    ) {
        StoryEntity story = requirePublishedStory(storyId);
        Integer targetStoryId = Math.toIntExact(story.getId());
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);

        Page<CommentEntity> dataPage = commentRepository
                .findByStory_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(
                        targetStoryId,
                        PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))
                );

        return buildPagedResponse(dataPage, safePage, safeSize);
    }

    @Transactional
    public CommentResponse createChapterComment(
            UserEntity currentUser,
            Integer storyId,
            Long chapterId,
            CreateCommentRequest req
    ) {
        ChapterEntity chapter = requirePublishedChapter(storyId, chapterId);
        String content = normalizeContent(req);

        CommentEntity parentComment = null;
        CommentEntity rootComment = null;
        int depth = 0;
        if (req.parentCommentId() != null) {
            parentComment = commentRepository
                    .findByIdAndChapter_IdAndIsHiddenFalse(req.parentCommentId(), chapter.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent comment not found"));
            rootComment = parentComment.getRootComment() != null ? parentComment.getRootComment() : parentComment;
            depth = Math.min(parentComment.getDepth() + 1, 5);
        }

        CommentEntity comment = CommentEntity.builder()
                .user(currentUser)
                .chapter(chapter)
                .story(null)
                .parentComment(parentComment)
                .rootComment(rootComment)
                .content(content)
                .depth(depth)
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .build();

        return toResponse(commentRepository.save(comment), List.of());
    }

    @Transactional
    public CommentResponse createStoryComment(
            UserEntity currentUser,
            Integer storyId,
            CreateCommentRequest req
    ) {
        StoryEntity story = requirePublishedStory(storyId);
        Integer targetStoryId = Math.toIntExact(story.getId());
        String content = normalizeContent(req);

        CommentEntity parentComment = null;
        CommentEntity rootComment = null;
        int depth = 0;
        if (req.parentCommentId() != null) {
            parentComment = commentRepository
                    .findByIdAndStory_IdAndIsHiddenFalse(req.parentCommentId(), targetStoryId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent comment not found"));
            rootComment = parentComment.getRootComment() != null ? parentComment.getRootComment() : parentComment;
            depth = Math.min(parentComment.getDepth() + 1, 5);
        }

        CommentEntity comment = CommentEntity.builder()
                .user(currentUser)
                .chapter(null)
                .story(story)
                .parentComment(parentComment)
                .rootComment(rootComment)
                .content(content)
                .depth(depth)
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .build();

        return toResponse(commentRepository.save(comment), List.of());
    }

    // =========================================================================
    // PHẦN 2: LOGIC TỪ NHÁNH HEAD (Internal / Admin / Simple Operations)
    // =========================================================================

    /**
     * Tạo comment dạng Internal (không qua API Request DTO)
     */
    @Transactional
    public CommentEntity createInternalComment(String content, UserEntity user, ChapterEntity chapter, CommentEntity parentComment) {
        CommentEntity comment = CommentEntity.builder()
                .content(content)
                .user(user)
                .chapter(chapter)
                .parentComment(parentComment)
                .depth(calculateDepth(parentComment))
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .build();

        // Set root comment for threading
        if (parentComment != null) {
            comment.setRootComment(parentComment.getRootComment() != null ? parentComment.getRootComment() : parentComment);
        }

        return commentRepository.save(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentEntity> getCommentsByChapter(Long chapterId) {
        // Cần thêm hàm findByChapter_IdOrderByCreatedAtAsc vào Repo
        // return commentRepository.findByChapter_IdOrderByCreatedAtAsc(chapterId);
        // Tạm thời dùng hàm có sẵn nhưng sẽ chỉ lấy comment gốc hoặc cần tự implement
        return List.of(); // TODO: Mở comment dòng trên khi đã thêm hàm vào Repo
    }

    @Transactional(readOnly = true)
    public List<CommentEntity> getRootCommentsByChapter(Long chapterId) {
        // Cần thêm hàm findByChapter_IdAndParentCommentIsNullOrderByCreatedAtAsc vào Repo
        // return commentRepository.findByChapter_IdAndParentCommentIsNullOrderByCreatedAtAsc(chapterId);
        return List.of(); // TODO: Mở comment dòng trên khi đã thêm hàm vào Repo
    }

    @Transactional(readOnly = true)
    public List<CommentEntity> getReplies(Long parentCommentId) {
        // Cần thêm hàm findByParentComment_IdOrderByCreatedAtAsc vào Repo
        // return commentRepository.findByParentComment_IdOrderByCreatedAtAsc(parentCommentId);
        return List.of(); // TODO: Mở comment dòng trên khi đã thêm hàm vào Repo
    }

    @Transactional(readOnly = true)
    public List<CommentEntity> getUserComments(Long userId) {
        return commentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public CommentEntity hideComment(Long commentId) {
        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        comment.setIsHidden(true);
        return commentRepository.save(comment);
    }

    @Transactional(readOnly = true)
    public CommentEntity getCommentById(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found with id: " + commentId));
    }

    // =========================================================================
    // PHẦN 3: AUTHOR COMMENT MANAGEMENT
    // =========================================================================

    @Transactional(readOnly = true)
    public List<AuthorStoryOptionResponse> listAuthorStories(Long authorId) {
        return storyRepository.findByAuthor_IdOrderByCreatedAtDesc(authorId)
                .stream()
                .map(story -> new AuthorStoryOptionResponse(story.getId(), story.getTitle()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuthorChapterOptionResponse> listAuthorChapters(Long authorId, Integer storyId) {
        StoryEntity story = requireAuthorStory(authorId, storyId);
        return chapterRepository.findByStoryId(story.getId())
                .stream()
                .map(chapter -> new AuthorChapterOptionResponse(
                        chapter.getId(),
                        chapter.getTitle(),
                        chapter.getSequenceIndex()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuthorCommentResponse> listAuthorComments(Long authorId, Integer storyId, Long chapterId) {
        StoryEntity story = requireAuthorStory(authorId, storyId);
        List<CommentEntity> roots;

        if (chapterId != null) {
            chapterRepository.findByIdAndVolume_Story_Id(chapterId, story.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
            roots = commentRepository.findByChapter_IdAndParentCommentIsNullOrderByCreatedAtDesc(chapterId);
        } else {
            roots = commentRepository.findByStory_IdAndParentCommentIsNullOrderByCreatedAtDesc(storyId);
        }

        List<Long> rootIds = roots.stream().map(CommentEntity::getId).toList();
        List<CommentEntity> replies = rootIds.isEmpty()
                ? List.of()
                : commentRepository.findByRootComment_IdInAndParentCommentIsNotNullOrderByCreatedAtAsc(rootIds);
        Map<Long, List<CommentEntity>> repliesByRootId = new HashMap<>();
        for (CommentEntity reply : replies) {
            Long rootId = reply.getRootComment() != null ? reply.getRootComment().getId() : null;
            if (rootId == null) {
                continue;
            }
            repliesByRootId.computeIfAbsent(rootId, key -> new ArrayList<>()).add(reply);
        }

        return roots.stream()
                .map(root -> toAuthorResponse(root, repliesByRootId.getOrDefault(root.getId(), List.of())))
                .toList();
    }

    @Transactional
    public AuthorCommentResponse replyAsAuthor(UserEntity currentUser, Long parentCommentId, String content) {
        CommentEntity parent = commentRepository.findAuthorOwnedCommentById(parentCommentId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        String normalizedContent = normalizeAuthorReplyContent(content);

        CommentEntity reply = CommentEntity.builder()
                .user(currentUser)
                .chapter(parent.getChapter())
                .story(parent.getStory())
                .parentComment(parent)
                .rootComment(parent.getRootComment() != null ? parent.getRootComment() : parent)
                .content(normalizedContent)
                .depth(Math.min(parent.getDepth() + 1, 5))
                .isHidden(false)
                .createdAt(LocalDateTime.now())
                .build();

        CommentEntity saved = commentRepository.save(reply);
        return toAuthorResponse(saved, List.of());
    }

    @Transactional
    public void hideAuthorComment(Long authorId, Long commentId) {
        CommentEntity comment = commentRepository.findAuthorOwnedCommentById(commentId, authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        comment.setIsHidden(true);
        commentRepository.save(comment);
    }

    @Transactional
    public void unhideAuthorComment(Long authorId, Long commentId) {
        CommentEntity comment = commentRepository.findAuthorOwnedCommentById(commentId, authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        comment.setIsHidden(false);
        commentRepository.save(comment);
    }

    @Transactional
    public void deleteAuthorComment(Long authorId, Long commentId) {
        CommentEntity comment = commentRepository.findAuthorOwnedCommentById(commentId, authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        deleteCommentAndDescendantsFromDb(comment);
    }

    /** Permanently deletes the comment and all its replies from the database, and any reports targeting them. */
    private void deleteCommentAndDescendantsFromDb(CommentEntity comment) {
        reportRepository.deleteByComment_Id(comment.getId());
        for (CommentEntity child : commentRepository.findByParentComment_Id(comment.getId())) {
            deleteCommentAndDescendantsFromDb(child);
        }
        commentRepository.delete(comment);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private Integer calculateDepth(CommentEntity parentComment) {
        if (parentComment == null) {
            return 0;
        }
        return parentComment.getDepth() + 1;
    }

    private StoryEntity requirePublishedStory(Integer storyId) {
        StoryEntity story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
        if (story.getStatus() != StoryStatus.published) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Story is not public");
        }
        return story;
    }

    private ChapterEntity requirePublishedChapter(Integer storyId, Long chapterId) {
        StoryEntity story = requirePublishedStory(storyId);

        ChapterEntity chapter = chapterRepository
                .findByIdAndVolume_Story_Id(chapterId, story.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        if (chapter.getStatus() != ChapterStatus.published) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter is not public");
        }
        return chapter;
    }

    private String normalizeContent(CreateCommentRequest req) {
        if (req == null || req.content() == null || req.content().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment content is required");
        }
        String content = req.content().trim();
        if (content.length() > 4000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment is too long");
        }
        return content;
    }

    private PagedResponse<CommentResponse> buildPagedResponse(
            Page<CommentEntity> dataPage,
            int safePage,
            int safeSize
    ) {
        List<CommentEntity> rootComments = dataPage.getContent();
        List<Long> rootIds = rootComments.stream().map(CommentEntity::getId).toList();
        List<CommentEntity> replyEntities = rootIds.isEmpty()
                ? Collections.emptyList()
                : commentRepository.findByRootComment_IdInAndParentCommentIsNotNullAndIsHiddenFalseOrderByCreatedAtAsc(rootIds);

        Map<Long, List<CommentEntity>> repliesByRootId = new HashMap<>();
        for (CommentEntity reply : replyEntities) {
            Long rootId = reply.getRootComment() != null ? reply.getRootComment().getId() : null;
            if (rootId == null) {
                continue;
            }
            repliesByRootId.computeIfAbsent(rootId, key -> new ArrayList<>()).add(reply);
        }

        List<CommentResponse> items = rootComments
                .stream()
                .map(root -> toResponse(root, repliesByRootId.getOrDefault(root.getId(), List.of())))
                .toList();

        return new PagedResponse<>(
                items,
                safePage,
                safeSize,
                dataPage.getTotalElements(),
                dataPage.getTotalPages(),
                dataPage.hasNext()
        );
    }

    private CommentResponse toResponse(CommentEntity comment, List<CommentEntity> replies) {
        UserEntity user = comment.getUser();
        List<CommentResponse> replyResponses = replies.stream()
                .map(reply -> toResponse(reply, List.of()))
                .toList();

        return new CommentResponse(
                comment.getId(),
                user != null ? user.getId() : null,
                user != null ? user.getUsername() : "Unknown",
                user != null ? user.getAvatarUrl() : null,
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getParentComment() != null ? comment.getParentComment().getId() : null,
                comment.getDepth(),
                replyResponses
        );
    }

    private int normalizePage(Integer page) {
        if (page == null || page < 0) {
            return 0;
        }
        return page;
    }

    private int normalizeSize(Integer size) {
        if (size == null || size <= 0) {
            return 8;
        }
        return Math.min(size, 50);
    }

    private StoryEntity requireAuthorStory(Long authorId, Integer storyId) {
        if (storyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Story is required");
        }
        return storyRepository.findByIdAndAuthorId(storyId, authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
    }

    private String normalizeAuthorReplyContent(String content) {
        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply content is required");
        }
        String value = content.trim();
        if (value.length() > 4000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply is too long");
        }
        return value;
    }

    private AuthorCommentResponse toAuthorResponse(CommentEntity root, List<CommentEntity> flatReplies) {
        Map<Long, List<CommentEntity>> repliesByParentId = new HashMap<>();
        for (CommentEntity reply : flatReplies) {
            Long parentId = reply.getParentComment() != null ? reply.getParentComment().getId() : null;
            if (parentId == null) {
                continue;
            }
            repliesByParentId.computeIfAbsent(parentId, key -> new ArrayList<>()).add(reply);
        }
        return toAuthorNode(root, repliesByParentId);
    }

    private AuthorCommentResponse toAuthorNode(CommentEntity comment, Map<Long, List<CommentEntity>> repliesByParentId) {
        UserEntity user = comment.getUser();
        String displayName = user != null
                ? ((user.getDisplayName() != null && !user.getDisplayName().isBlank()) ? user.getDisplayName() : user.getUsername())
                : "Unknown";
        List<CommentEntity> directReplies = repliesByParentId.getOrDefault(comment.getId(), List.of());
        List<AuthorCommentResponse> replyDtos = directReplies.stream()
                .map(reply -> toAuthorNode(reply, repliesByParentId))
                .toList();
        return new AuthorCommentResponse(
                comment.getId(),
                user != null ? user.getId() : null,
                displayName,
                user != null ? user.getAvatarUrl() : null,
                comment.getContent(),
                comment.getCreatedAt(),
                resolveCommentStatus(comment),
                comment.getParentComment() != null ? comment.getParentComment().getId() : null,
                comment.getDepth(),
                replyDtos
        );
    }

    private String resolveCommentStatus(CommentEntity comment) {
        if (Boolean.TRUE.equals(comment.getIsHidden())) {
            return "Hidden";
        }
        long reportCount = reportRepository.countByComment_IdAndStatusIn(
                comment.getId(),
                List.of(ReportEntity.ReportStatus.open, ReportEntity.ReportStatus.in_review)
        );
        if (reportCount > 0) {
            return "Reported";
        }
        return "Normal";
    }
}



//package com.example.WebTruyen.service;
//
//<<<<<<< HEAD
//import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
//import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
//import com.example.WebTruyen.entity.model.Content.ChapterEntity;
//import com.example.WebTruyen.repository.CommentRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDateTime;
//import java.util.List;
//
//@Service
//@RequiredArgsConstructor
//@Transactional
//public class CommentService {
//
//    private final CommentRepository commentRepository;
//
//    public CommentEntity createComment(String content, UserEntity user, ChapterEntity chapter, CommentEntity parentComment) {
//        CommentEntity comment = CommentEntity.builder()
//                .content(content)
//                .user(user)
//                .chapter(chapter)
//                .parentComment(parentComment)
//                .depth(calculateDepth(parentComment))
//                .isHidden(false)
//                .createdAt(LocalDateTime.now())
//                .build();
//
//        // Set root comment for threading
//        if (parentComment != null) {
//            comment.setRootComment(parentComment.getRootComment() != null ? parentComment.getRootComment() : parentComment);
//        }
//
//        return commentRepository.save(comment);
//    }
//
//    public List<CommentEntity> getCommentsByChapter(Long chapterId) {
//        return commentRepository.findByChapterIdOrderByCreatedAtAsc(chapterId);
//    }
//
//    public List<CommentEntity> getRootCommentsByChapter(Long chapterId) {
//        return commentRepository.findRootCommentsByChapterId(chapterId);
//    }
//
//    public List<CommentEntity> getReplies(Long parentCommentId) {
//        return commentRepository.findByParentCommentIdOrderByCreatedAtAsc(parentCommentId);
//    }
//
//    public List<CommentEntity> getUserComments(Long userId) {
//        return commentRepository.findByUserIdOrderByCreatedAtDesc(userId);
//    }
//
//    public CommentEntity hideComment(Long commentId) {
//        CommentEntity comment = commentRepository.findById(commentId)
//                .orElseThrow(() -> new RuntimeException("Comment not found"));
//        comment.setIsHidden(true);
//        return commentRepository.save(comment);
//    }
//
//    public CommentEntity getCommentById(Long commentId) {
//        return commentRepository.findById(commentId)
//                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));
//    }
//
//    private Integer calculateDepth(CommentEntity parentComment) {
//        if (parentComment == null) {
//            return 0;
//        }
//        return parentComment.getDepth() + 1;
//=======
//import com.example.WebTruyen.dto.request.CreateCommentRequest;
//import com.example.WebTruyen.dto.response.CommentResponse;
//import com.example.WebTruyen.dto.response.PagedResponse;
//import com.example.WebTruyen.entity.enums.ChapterStatus;
//import com.example.WebTruyen.entity.enums.StoryStatus;
//import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
//import com.example.WebTruyen.entity.model.Content.ChapterEntity;
//import com.example.WebTruyen.entity.model.Content.StoryEntity;
//import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
//import com.example.WebTruyen.repository.ChapterRepository;
//import com.example.WebTruyen.repository.CommentRepository;
//import com.example.WebTruyen.repository.StoryRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.data.domain.Sort;
//import org.springframework.http.HttpStatus;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//import org.springframework.web.server.ResponseStatusException;
//
//import java.time.LocalDateTime;
//import java.util.ArrayList;
//import java.util.Collections;
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//
//@Service
//@RequiredArgsConstructor
//public class CommentService {
//
//    private final StoryRepository storyRepository;
//    private final ChapterRepository chapterRepository;
//    private final CommentRepository commentRepository;
//
//    @Transactional(readOnly = true)
//    public PagedResponse<CommentResponse> listPublishedChapterComments(
//            Integer storyId,
//            Long chapterId,
//            Integer page,
//            Integer size
//    ) {
//        ChapterEntity chapter = requirePublishedChapter(storyId, chapterId);
//        int safePage = normalizePage(page);
//        int safeSize = normalizeSize(size);
//
//        Page<CommentEntity> dataPage = commentRepository
//                .findByChapter_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(
//                        chapter.getId(),
//                        PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))
//                );
//
//        return buildPagedResponse(dataPage, safePage, safeSize);
//    }
//
//    @Transactional(readOnly = true)
//    public PagedResponse<CommentResponse> listPublishedStoryComments(
//            Integer storyId,
//            Integer page,
//            Integer size
//    ) {
//        StoryEntity story = requirePublishedStory(storyId);
//        Integer targetStoryId = Math.toIntExact(story.getId());
//        int safePage = normalizePage(page);
//        int safeSize = normalizeSize(size);
//
//        Page<CommentEntity> dataPage = commentRepository
//                .findByStory_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(
//                        targetStoryId,
//                        PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))
//                );
//
//        return buildPagedResponse(dataPage, safePage, safeSize);
//    }
//
//    @Transactional
//    public CommentResponse createChapterComment(
//            UserEntity currentUser,
//            Integer storyId,
//            Long chapterId,
//            CreateCommentRequest req
//    ) {
//        ChapterEntity chapter = requirePublishedChapter(storyId, chapterId);
//        String content = normalizeContent(req);
//
//        CommentEntity parentComment = null;
//        CommentEntity rootComment = null;
//        int depth = 0;
//        if (req.parentCommentId() != null) {
//            parentComment = commentRepository
//                    .findByIdAndChapter_IdAndIsHiddenFalse(req.parentCommentId(), chapter.getId())
//                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent comment not found"));
//            rootComment = parentComment.getRootComment() != null ? parentComment.getRootComment() : parentComment;
//            depth = Math.min(parentComment.getDepth() + 1, 5);
//        }
//
//        CommentEntity comment = CommentEntity.builder()
//                .user(currentUser)
//                .chapter(chapter)
//                .story(null)
//                .parentComment(parentComment)
//                .rootComment(rootComment)
//                .content(content)
//                .depth(depth)
//                .isHidden(false)
//                .createdAt(LocalDateTime.now())
//                .build();
//
//        return toResponse(commentRepository.save(comment), List.of());
//    }
//
//    @Transactional
//    public CommentResponse createStoryComment(
//            UserEntity currentUser,
//            Integer storyId,
//            CreateCommentRequest req
//    ) {
//        StoryEntity story = requirePublishedStory(storyId);
//        Integer targetStoryId = Math.toIntExact(story.getId());
//        String content = normalizeContent(req);
//
//        CommentEntity parentComment = null;
//        CommentEntity rootComment = null;
//        int depth = 0;
//        if (req.parentCommentId() != null) {
//            parentComment = commentRepository
//                    .findByIdAndStory_IdAndIsHiddenFalse(req.parentCommentId(), targetStoryId)
//                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent comment not found"));
//            rootComment = parentComment.getRootComment() != null ? parentComment.getRootComment() : parentComment;
//            depth = Math.min(parentComment.getDepth() + 1, 5);
//        }
//
//        CommentEntity comment = CommentEntity.builder()
//                .user(currentUser)
//                .chapter(null)
//                .story(story)
//                .parentComment(parentComment)
//                .rootComment(rootComment)
//                .content(content)
//                .depth(depth)
//                .isHidden(false)
//                .createdAt(LocalDateTime.now())
//                .build();
//
//        return toResponse(commentRepository.save(comment), List.of());
//    }
//
//    private StoryEntity requirePublishedStory(Integer storyId) {
//        StoryEntity story = storyRepository.findById(storyId)
//                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
//        if (story.getStatus() != StoryStatus.published) {
//            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Story is not public");
//        }
//        return story;
//    }
//
//    private ChapterEntity requirePublishedChapter(Integer storyId, Long chapterId) {
//        StoryEntity story = requirePublishedStory(storyId);
//
//        ChapterEntity chapter = chapterRepository
//                .findByIdAndVolume_Story_Id(chapterId, story.getId())
//                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
//        if (chapter.getStatus() != ChapterStatus.published) {
//            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter is not public");
//        }
//        return chapter;
//    }
//
//    private String normalizeContent(CreateCommentRequest req) {
//        if (req == null || req.content() == null || req.content().isBlank()) {
//            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment content is required");
//        }
//        String content = req.content().trim();
//        if (content.length() > 4000) {
//            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment is too long");
//        }
//        return content;
//    }
//
//    private PagedResponse<CommentResponse> buildPagedResponse(
//            Page<CommentEntity> dataPage,
//            int safePage,
//            int safeSize
//    ) {
//        List<CommentEntity> rootComments = dataPage.getContent();
//        List<Long> rootIds = rootComments.stream().map(CommentEntity::getId).toList();
//        List<CommentEntity> replyEntities = rootIds.isEmpty()
//                ? Collections.emptyList()
//                : commentRepository.findByRootComment_IdInAndParentCommentIsNotNullAndIsHiddenFalseOrderByCreatedAtAsc(rootIds);
//
//        Map<Long, List<CommentEntity>> repliesByRootId = new HashMap<>();
//        for (CommentEntity reply : replyEntities) {
//            Long rootId = reply.getRootComment() != null ? reply.getRootComment().getId() : null;
//            if (rootId == null) {
//                continue;
//            }
//            repliesByRootId.computeIfAbsent(rootId, key -> new ArrayList<>()).add(reply);
//        }
//
//        List<CommentResponse> items = rootComments
//                .stream()
//                .map(root -> toResponse(root, repliesByRootId.getOrDefault(root.getId(), List.of())))
//                .toList();
//
//        return new PagedResponse<>(
//                items,
//                safePage,
//                safeSize,
//                dataPage.getTotalElements(),
//                dataPage.getTotalPages(),
//                dataPage.hasNext()
//        );
//    }
//
//    private CommentResponse toResponse(CommentEntity comment, List<CommentEntity> replies) {
//        UserEntity user = comment.getUser();
//        List<CommentResponse> replyResponses = replies.stream()
//                .map(reply -> toResponse(reply, List.of()))
//                .toList();
//
//        return new CommentResponse(
//                comment.getId(),
//                user != null ? user.getId() : null,
//                user != null ? user.getUsername() : "Unknown",
//                user != null ? user.getAvatarUrl() : null,
//                comment.getContent(),
//                comment.getCreatedAt(),
//                comment.getParentComment() != null ? comment.getParentComment().getId() : null,
//                comment.getDepth(),
//                replyResponses
//        );
//    }
//
//    private int normalizePage(Integer page) {
//        if (page == null || page < 0) {
//            return 0;
//        }
//        return page;
//    }
//
//    private int normalizeSize(Integer size) {
//        if (size == null || size <= 0) {
//            return 8;
//        }
//        return Math.min(size, 50);
//>>>>>>> author-create-content
//    }
//}
