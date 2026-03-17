package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.CreateLibraryAlbumRequest;
import com.example.WebTruyen.dto.response.LibraryAlbumCardResponse;
import com.example.WebTruyen.dto.response.LibraryAlbumDetailResponse;
import com.example.WebTruyen.dto.response.LibraryAlbumOptionResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.LibraryAlbumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/library/albums")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class LibraryAlbumController {

    private final LibraryAlbumService libraryAlbumService;

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }

    @GetMapping
    public java.util.List<LibraryAlbumCardResponse> getAlbums(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return libraryAlbumService.getAlbums(currentUser);
    }

    @GetMapping("/user/{userId}")
    public java.util.List<LibraryAlbumCardResponse> getUserAlbums(
            @PathVariable Long userId
    ) {
        return libraryAlbumService.getAlbumsByUserId(userId);
    }

    @GetMapping("/{albumId}")
    public LibraryAlbumDetailResponse getAlbumDetail(
            @PathVariable Long albumId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return libraryAlbumService.getAlbumDetail(currentUser, albumId);
    }

    @GetMapping("/{albumId}/public")
    public LibraryAlbumDetailResponse getPublicAlbumDetail(
            @PathVariable Long albumId
    ) {
        return libraryAlbumService.getPublicAlbumDetail(albumId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LibraryAlbumOptionResponse createAlbum(
            @Valid @RequestBody CreateLibraryAlbumRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return libraryAlbumService.createAlbum(currentUser, request);
    }
}
