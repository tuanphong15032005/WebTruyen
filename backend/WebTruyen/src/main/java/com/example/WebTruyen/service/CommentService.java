package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateCommentRequest;
import com.example.WebTruyen.dto.request.ReportCommentRequest;
import com.example.WebTruyen.dto.request.UpdateCommentRequest;
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

        long totalComments = commentRepository.countByChapter_IdAndIsHiddenFalse(chapter.getId());
        return buildPagedResponse(dataPage, safePage, safeSize, totalComments);
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

        long totalComments = commentRepository.countByStory_IdAndIsHiddenFalse(targetStoryId);
        return buildPagedResponse(dataPage, safePage, safeSize, totalComments);
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

    @Transactional
    public CommentResponse updateStoryComment(
            UserEntity currentUser,
            Integer storyId,
            Long commentId,
            UpdateCommentRequest req
    ) {
        StoryEntity story = requirePublishedStory(storyId);
        Integer targetStoryId = Math.toIntExact(story.getId());
        CommentEntity comment = commentRepository.findByIdAndStory_IdAndIsHiddenFalse(commentId, targetStoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        Long ownerId = comment.getUser() != null ? comment.getUser().getId() : null;
        if (ownerId == null || !ownerId.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot edit this comment");
        }

        comment.setContent(normalizeContent(req != null ? req.content() : null));
        CommentEntity saved = commentRepository.save(comment);
        return toResponse(saved, List.of());
    }

    @Transactional
    public void deleteStoryComment(
            UserEntity currentUser,
            Integer storyId,
            Long commentId
    ) {
        StoryEntity story = requirePublishedStory(storyId);
        Integer targetStoryId = Math.toIntExact(story.getId());
        CommentEntity comment = commentRepository.findByIdAndStory_IdAndIsHiddenFalse(commentId, targetStoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        Long ownerId = comment.getUser() != null ? comment.getUser().getId() : null;
        if (ownerId == null || !ownerId.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete this comment");
        }

        List<CommentEntity> commentsToHide = new ArrayList<>();
        commentsToHide.add(comment);

        if (comment.getParentComment() == null) {
            List<CommentEntity> replies = commentRepository.findByRootComment_IdAndIsHiddenFalseOrderByCreatedAtAsc(comment.getId());
            commentsToHide.addAll(replies);
        } else {
            Long rootId = comment.getRootComment() != null ? comment.getRootComment().getId() : null;
            if (rootId != null) {
                List<CommentEntity> allReplies = commentRepository.findByRootComment_IdAndIsHiddenFalseOrderByCreatedAtAsc(rootId);
                commentsToHide.addAll(collectDescendants(comment.getId(), allReplies));
            }
        }

        commentsToHide.forEach(item -> item.setIsHidden(true));
        commentRepository.saveAll(commentsToHide);
    }

    @Transactional
    public void reportStoryComment(
            UserEntity currentUser,
            Integer storyId,
            Long commentId,
            ReportCommentRequest req
    ) {
        StoryEntity story = requirePublishedStory(storyId);
        Integer targetStoryId = Math.toIntExact(story.getId());
        CommentEntity comment = commentRepository.findByIdAndStory_IdAndIsHiddenFalse(commentId, targetStoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        String reason = req != null && req.reason() != null ? req.reason().trim() : "";
        String details = req != null && req.details() != null ? req.details().trim() : null;
        if (reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Report reason is required");
        }

        ReportEntity report = ReportEntity.builder()
                .reporter(currentUser)
                .targetKind(ReportEntity.ReportTargetKind.comment)
                .story(null)
                .chapter(null)
                .comment(comment)
                .reason(reason)
                .details(details != null && !details.isBlank() ? details : null)
                .status(ReportEntity.ReportStatus.open)
                .actionTakenBy(null)
                .action(null)
                .createdAt(LocalDateTime.now())
                .resolvedAt(null)
                .build();
        reportRepository.save(report);
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
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment content is required");
        }
        return normalizeContent(req.content());
    }

    private String normalizeContent(String rawContent) {
        if (rawContent == null || rawContent.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment content is required");
        }
        String content = rawContent.trim();
        if (content.length() > 4000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment is too long");
        }
        return content;
    }

    private PagedResponse<CommentResponse> buildPagedResponse(
            Page<CommentEntity> dataPage,
            int safePage,
            int safeSize,
            long totalElements
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
                totalElements,
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
                comment.getParentComment() != null && comment.getParentComment().getUser() != null
                        ? comment.getParentComment().getUser().getId()
                        : null,
                comment.getParentComment() != null && comment.getParentComment().getUser() != null
                        ? comment.getParentComment().getUser().getUsername()
                        : null,
                comment.getDepth(),
                replyResponses
        );
    }

    private List<CommentEntity> collectDescendants(Long targetCommentId, List<CommentEntity> allReplies) {
        if (allReplies.isEmpty()) {
            return List.of();
        }

        Map<Long, List<CommentEntity>> childrenByParentId = new HashMap<>();
        for (CommentEntity reply : allReplies) {
            Long parentId = reply.getParentComment() != null ? reply.getParentComment().getId() : null;
            if (parentId == null) {
                continue;
            }
            childrenByParentId.computeIfAbsent(parentId, ignored -> new ArrayList<>()).add(reply);
        }

        List<CommentEntity> descendants = new ArrayList<>();
        ArrayList<Long> queue = new ArrayList<>();
        queue.add(targetCommentId);
        int cursor = 0;
        while (cursor < queue.size()) {
            Long parentId = queue.get(cursor++);
            List<CommentEntity> children = childrenByParentId.getOrDefault(parentId, List.of());
            for (CommentEntity child : children) {
                descendants.add(child);
                queue.add(child.getId());
            }
        }
        return descendants;
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
}
