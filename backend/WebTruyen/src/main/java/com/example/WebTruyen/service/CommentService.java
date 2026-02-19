package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateCommentRequest;
import com.example.WebTruyen.dto.respone.CommentResponse;
import com.example.WebTruyen.dto.respone.PagedResponse;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.CommentRepository;
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
}
