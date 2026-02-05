package com.example.WebTruyen.controller;


import com.example.WebTruyen.dto.request.CreateStoryRequest;
import com.example.WebTruyen.dto.respone.StoryResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.service.StoryService;
import lombok.RequiredArgsConstructor;
import org.hibernate.query.Page;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;
    private final UserRepository userRepo;


    @PostMapping(value = "/stories", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StoryResponse createStory(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "cover", required = false) MultipartFile cover
    ) throws Exception {
        CreateStoryRequest data = new ObjectMapper().readValue(dataJson, CreateStoryRequest.class);

        UserEntity currentUser = userRepo.getReferenceById(1L);
        return storyService.createStory(currentUser, data, cover);
    }

//    // READ DETAIL
//    @GetMapping("/author/stories/{id}")
//    public StoryResponse getMyStory(@PathVariable Integer id) {
//        Integer authorId = authFacade.currentUserId();
//        return storyService.getMyStory(authorId, id);
//    }
//
//    // DELETE
//    @DeleteMapping("/author/stories/{id}")
//    public void deleteMyStory(@PathVariable Integer id) {
//        Integer authorId = authFacade.currentUserId();
//        storyService.deleteMyStory(authorId, id);
//    }


}