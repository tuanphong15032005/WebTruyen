package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateBookmarkRequest;
import com.example.WebTruyen.dto.response.BookmarkResponse;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.ChapterSegmentEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.BookmarkEntity;
import com.example.WebTruyen.repository.BookmarkRepository;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ChapterSegmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterSegmentRepository chapterSegmentRepository;

    @Transactional(readOnly = true)
    public List<BookmarkResponse> listByChapter(UserEntity currentUser, Long chapterId) {
        if (chapterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "chapterId is required");
        }
        return bookmarkRepository
                .findByUser_IdAndChapter_IdOrderByCreatedAtDesc(currentUser.getId(), chapterId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BookmarkResponse create(UserEntity currentUser, CreateBookmarkRequest req) {
        if (req == null || req.chapterId() == null || req.segmentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "chapterId and segmentId are required");
        }

        ChapterEntity chapter = chapterRepository.findById(req.chapterId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        ChapterSegmentEntity segment = chapterSegmentRepository.findById(req.segmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Segment not found"));

        if (!segment.getChapter().getId().equals(chapter.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Segment does not belong to chapter");
        }

        BookmarkEntity bookmark = bookmarkRepository
                .findByUser_IdAndChapter_IdAndSegment_Id(currentUser.getId(), chapter.getId(), segment.getId())
                .orElseGet(() -> BookmarkEntity.builder()
                        .user(currentUser)
                        .chapter(chapter)
                        .segment(segment)
                        .createdAt(LocalDateTime.now())
                        .build());

        bookmark.setPositionPercent(req.positionPercent());
        bookmark.setIsFavorite(Boolean.TRUE.equals(req.isFavorite()));

        BookmarkEntity saved = bookmarkRepository.save(bookmark);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UserEntity currentUser, Long bookmarkId) {
        BookmarkEntity bookmark = bookmarkRepository
                .findByIdAndUser_Id(bookmarkId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found"));
        bookmarkRepository.delete(bookmark);
    }

    private BookmarkResponse toResponse(BookmarkEntity bookmark) {
        return new BookmarkResponse(
                bookmark.getId(),
                bookmark.getChapter() != null ? bookmark.getChapter().getId() : null,
                bookmark.getSegment() != null ? bookmark.getSegment().getId() : null,
                bookmark.getPositionPercent(),
                Boolean.TRUE.equals(bookmark.getIsFavorite()),
                bookmark.getCreatedAt()
        );
    }
}
