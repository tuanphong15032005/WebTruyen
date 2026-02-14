package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.AuthorReplyRequest;
import com.example.WebTruyen.dto.response.AuthorChapterOption;
import com.example.WebTruyen.dto.response.AuthorCommentItem;
import com.example.WebTruyen.dto.response.AuthorStoryOption;
import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import com.example.WebTruyen.entity.model.CommentAndMod.ReportEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.CommentRepository;
import com.example.WebTruyen.repository.ReportRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthorCommentService {

    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final CommentRepository commentRepository;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    private static final List<ReportEntity.ReportStatus> OPEN_REPORT_STATUSES =
            List.of(ReportEntity.ReportStatus.open, ReportEntity.ReportStatus.in_review);

    @Transactional(readOnly = true)
    public List<AuthorStoryOption> getStoriesByAuthor(Long authorId) {
        List<StoryEntity> stories = storyRepository.findByAuthor_IdOrderByCreatedAtDesc(authorId);
        return stories.stream()
                .map(s -> AuthorStoryOption.builder()
                        .id(s.getId())
                        .title(s.getTitle())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuthorChapterOption> getChaptersByStory(Long storyId, Long authorId) {
        StoryEntity story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not the author of this story");
        }
        List<ChapterEntity> chapters = chapterRepository.findByVolume_Story_IdOrderByVolume_SequenceIndexAscSequenceIndexAsc(storyId);
        return chapters.stream()
                .map(c -> AuthorChapterOption.builder()
                        .id(c.getId())
                        .title(c.getTitle())
                        .volumeTitle(c.getVolume().getTitle())
                        .volumeSequence(c.getVolume().getSequenceIndex())
                        .chapterSequence(c.getSequenceIndex())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuthorCommentItem> getCommentsForAuthor(Long storyId, Long chapterId, Long authorId) {
        StoryEntity story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not the author of this story");
        }

        List<Long> chapterIds;
        Map<Long, String> chapterTitles = new HashMap<>();
        if (chapterId != null) {
            ChapterEntity ch = chapterRepository.findById(chapterId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
            if (!ch.getVolume().getStory().getId().equals(storyId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chapter does not belong to story");
            }
            chapterIds = List.of(chapterId);
            chapterTitles.put(chapterId, ch.getTitle());
        } else {
            List<ChapterEntity> chapters = chapterRepository.findByVolume_Story_IdOrderByVolume_SequenceIndexAscSequenceIndexAsc(storyId);
            chapterIds = chapters.stream().map(ChapterEntity::getId).toList();
            chapters.forEach(c -> chapterTitles.put(c.getId(), c.getTitle()));
        }

        List<CommentEntity> allComments = commentRepository.findByChapter_IdInOrderByCreatedAtAsc(chapterIds);
        Set<Long> reportedCommentIds = new HashSet<>();
        for (CommentEntity c : allComments) {
            if (reportRepository.existsByComment_IdAndStatusIn(c.getId(), OPEN_REPORT_STATUSES)) {
                reportedCommentIds.add(c.getId());
            }
        }

        Map<Long, AuthorCommentItem> itemMap = new HashMap<>();
        for (CommentEntity c : allComments) {
            String status = c.getIsHidden() ? "Hidden" : (reportedCommentIds.contains(c.getId()) ? "Reported" : "Normal");
            String displayName = StringUtils.hasText(c.getUser().getDisplayName())
                    ? c.getUser().getDisplayName()
                    : (StringUtils.hasText(c.getUser().getAuthorPenName()) ? c.getUser().getAuthorPenName() : c.getUser().getUsername());
            AuthorCommentItem item = AuthorCommentItem.builder()
                    .id(c.getId())
                    .readerAvatarUrl(c.getUser().getAvatarUrl())
                    .readerDisplayName(displayName)
                    .content(c.getContent())
                    .createdAt(c.getCreatedAt())
                    .status(status)
                    .parentId(c.getParentComment() != null ? c.getParentComment().getId() : null)
                    .rootId(c.getRootComment() != null ? c.getRootComment().getId() : null)
                    .chapterId(c.getChapter().getId())
                    .chapterTitle(chapterTitles.get(c.getChapter().getId()))
                    .replies(new ArrayList<>())
                    .build();
            itemMap.put(c.getId(), item);
        }

        List<AuthorCommentItem> roots = new ArrayList<>();
        for (AuthorCommentItem item : itemMap.values()) {
            if (item.getParentId() == null) {
                roots.add(item);
            } else {
                AuthorCommentItem parent = itemMap.get(item.getParentId());
                if (parent != null) {
                    parent.getReplies().add(item);
                } else {
                    roots.add(item);
                }
            }
        }
        roots.sort(Comparator.comparing(AuthorCommentItem::getCreatedAt));
        for (AuthorCommentItem root : roots) {
            root.getReplies().sort(Comparator.comparing(AuthorCommentItem::getCreatedAt));
        }
        return roots;
    }

    @Transactional
    public AuthorCommentItem replyToComment(Long commentId, AuthorReplyRequest request, Long authorId) {
        CommentEntity parent = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        StoryEntity story = parent.getChapter().getVolume().getStory();
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not the author of this story");
        }
        String content = request != null && StringUtils.hasText(request.getContent()) ? request.getContent().trim() : null;
        if (content == null || content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply content is required");
        }

        CommentEntity root = parent.getRootComment() != null ? parent.getRootComment() : parent;
        UserEntity author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        CommentEntity reply = CommentEntity.builder()
                .user(author)
                .chapter(parent.getChapter())
                .parentComment(parent)
                .rootComment(root)
                .content(content)
                .depth(parent.getDepth() + 1)
                .isHidden(false)
                .createdAt(java.time.LocalDateTime.now())
                .replies(new ArrayList<>())
                .build();
        reply = commentRepository.save(reply);

        String displayName = StringUtils.hasText(author.getDisplayName())
                ? author.getDisplayName()
                : (StringUtils.hasText(author.getAuthorPenName()) ? author.getAuthorPenName() : author.getUsername());
        return AuthorCommentItem.builder()
                .id(reply.getId())
                .readerAvatarUrl(author.getAvatarUrl())
                .readerDisplayName(displayName)
                .content(reply.getContent())
                .createdAt(reply.getCreatedAt())
                .status("Normal")
                .parentId(parent.getId())
                .rootId(root.getId())
                .chapterId(reply.getChapter().getId())
                .chapterTitle(reply.getChapter().getTitle())
                .replies(List.of())
                .build();
    }

    @Transactional
    public void hideComment(Long commentId, Long authorId) {
        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        StoryEntity story = comment.getChapter().getVolume().getStory();
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not the author of this story");
        }
        comment.setIsHidden(true);
        commentRepository.save(comment);
    }
}
