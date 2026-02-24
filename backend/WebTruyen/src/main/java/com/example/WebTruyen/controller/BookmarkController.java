package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.CreateBookmarkRequest;
import com.example.WebTruyen.dto.response.BookmarkResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }

    @GetMapping("/chapter/{chapterId}")
    public List<BookmarkResponse> getBookmarksByChapter(
            @PathVariable Long chapterId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return bookmarkService.listByChapter(currentUser, chapterId);
    }

    @PostMapping
    public BookmarkResponse createBookmark(
            @RequestBody CreateBookmarkRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return bookmarkService.create(currentUser, req);
    }

    @DeleteMapping("/{bookmarkId}")
    public Map<String, Boolean> deleteBookmark(
            @PathVariable Long bookmarkId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        bookmarkService.delete(currentUser, bookmarkId);
        return Map.of("deleted", true);
    }
}
