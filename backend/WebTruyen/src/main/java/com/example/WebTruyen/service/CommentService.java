package com.example.WebTruyen.service;

import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {
    
    private final CommentRepository commentRepository;
    
    public CommentEntity createComment(String content, UserEntity user, ChapterEntity chapter, CommentEntity parentComment) {
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
    
    public List<CommentEntity> getCommentsByChapter(Long chapterId) {
        return commentRepository.findByChapterIdOrderByCreatedAtAsc(chapterId);
    }
    
    public List<CommentEntity> getRootCommentsByChapter(Long chapterId) {
        return commentRepository.findRootCommentsByChapterId(chapterId);
    }
    
    public List<CommentEntity> getReplies(Long parentCommentId) {
        return commentRepository.findByParentCommentIdOrderByCreatedAtAsc(parentCommentId);
    }
    
    public List<CommentEntity> getUserComments(Long userId) {
        return commentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public CommentEntity hideComment(Long commentId) {
        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        comment.setIsHidden(true);
        return commentRepository.save(comment);
    }
    
    public CommentEntity getCommentById(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));
    }
    
    private Integer calculateDepth(CommentEntity parentComment) {
        if (parentComment == null) {
            return 0;
        }
        return parentComment.getDepth() + 1;
    }
}
