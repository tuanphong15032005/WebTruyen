package com.example.WebTruyen.service.impl;

import com.example.WebTruyen.dto.request.CreateChapterRequest;
import com.example.WebTruyen.dto.response.ChapterDetailResponse;
import com.example.WebTruyen.dto.response.ChapterResponse;
import com.example.WebTruyen.dto.response.CreateChapterResponse;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.ChapterSegmentEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.Content.VolumeEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ChapterSegmentRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.VolumeRepository;
import com.example.WebTruyen.service.ChapterService;
import com.example.WebTruyen.service.StorageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Safelist;
import org.jsoup.select.Elements;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChapterServiceImpl implements ChapterService {

    private final StoryRepository storyRepository;
    private final VolumeRepository volumeRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterSegmentRepository chapterSegmentRepository;
    private final StorageService storageService;

    // ============================================================
    // AUTHOR - CREATE CHAPTER
    // ============================================================

    @Override
    @Transactional
    public CreateChapterResponse createChapterFromHtml(UserEntity currentUser,
                                                       Long storyId,
                                                       Long volumeId,
                                                       CreateChapterRequest req) {
        VolumeEntity volume = volumeRepository.findById(volumeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Volume not found."));
        if (!volume.getStory().getId().equals(storyId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Volume does not belong to story");
        }

        StoryEntity story = volume.getStory();
        if (!story.getAuthor().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not owner of story");
        }

        boolean isFree = req.getIsFree() == null ? true : req.getIsFree();
        if (!isFree && req.getPriceCoin() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "priceCoin required for paid chapter");
        }

        Integer nextIndex = req.getSequenceIndex();
        if (nextIndex == null || nextIndex <= 0) {
            Integer maxIndex = chapterRepository.findMaxSequenceIndexByVolumeId(volumeId);
            nextIndex = (maxIndex == null ? 0 : maxIndex) + 1;
        }

        ChapterEntity chapter = ChapterEntity.builder()
                .volume(volume)
                .title(req.getTitle())
                .sequenceIndex(nextIndex)
                .free(isFree)
                .priceCoin(req.getPriceCoin())
                .status(parseStatus(req.getStatus(), ChapterStatus.draft))
                .createdAt(LocalDateTime.now())
                .lastUpdateAt(LocalDateTime.now())
                .build();

        ChapterEntity saved = chapterRepository.save(chapter);
        processAndSaveContent(saved, req.getContentHtml());

        List<ChapterSegmentEntity> segs =
                chapterSegmentRepository.findByChapter_IdOrderBySeqAsc(saved.getId());

        CreateChapterResponse resp = new CreateChapterResponse();
        resp.setChapterId(saved.getId());
        resp.setSegmentIds(segs.stream().map(ChapterSegmentEntity::getId).toList());
        resp.setSegmentCount(segs.size());

        return resp;
    }

    // ============================================================
    // AUTHOR - UPDATE CHAPTER
    // ============================================================

    @Override
    @Transactional
    public CreateChapterResponse updateChapterFromHtml(UserEntity currentUser,
                                                       Long storyId,
                                                       Long volumeId,
                                                       Long chapterId,
                                                       CreateChapterRequest req) {
        ChapterEntity chapter = chapterRepository.findByIdAndVolume_Id(chapterId, volumeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found."));
        if (!chapter.getVolume().getStory().getAuthor().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not owner.");
        }

        chapter.setTitle(req.getTitle());
        chapter.setFree(req.getIsFree());
        chapter.setPriceCoin(req.getPriceCoin());
        chapter.setStatus(parseStatus(req.getStatus(), chapter.getStatus()));
        chapter.setLastUpdateAt(LocalDateTime.now());

        chapterRepository.save(chapter);

        chapterSegmentRepository.deleteByChapter_Id(chapterId);
        chapterSegmentRepository.flush();

        processAndSaveContent(chapter, req.getContentHtml());

        List<ChapterSegmentEntity> segs =
                chapterSegmentRepository.findByChapter_IdOrderBySeqAsc(chapter.getId());

        CreateChapterResponse resp = new CreateChapterResponse();
        resp.setChapterId(chapter.getId());
        resp.setSegmentIds(segs.stream().map(ChapterSegmentEntity::getId).toList());
        resp.setSegmentCount(segs.size());

        return resp;
    }

    // ============================================================
    // READER PAGE
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public ChapterDetailResponse getChapterDetail(Long chapterId) {

        ChapterEntity chapter = getChapterById(chapterId);

        List<ChapterSegmentEntity> segments =
                chapterSegmentRepository.findByChapter_IdOrderBySeqAsc(chapterId);

        List<ChapterDetailResponse.ChapterSegmentResponse> segmentResponses =
                segments.stream()
                        .map(s -> ChapterDetailResponse.ChapterSegmentResponse.builder()
                                .id(s.getId())
                                .seq(s.getSeq())
                                .segmentText(s.getSegmentText())
                                .build())
                        .collect(Collectors.toList());

        return ChapterDetailResponse.builder()
                .id(chapter.getId())
                .storyId(chapter.getVolume().getStory().getId())
                .volumeId(chapter.getVolume().getId())
                .title(chapter.getTitle())
                .free(chapter.isFree())
                .priceCoin(chapter.getPriceCoin())
                .status(chapter.getStatus())
                .sequenceIndex(chapter.getSequenceIndex())
                .segments(segmentResponses)
                .nextChapterId(getNextChapterId(chapterId))
                .previousChapterId(getPreviousChapterId(chapterId))
                .createdAt(chapter.getCreatedAt())
                .lastUpdateAt(chapter.getLastUpdateAt())
                .build();
    }

    @Override
    public Long getNextChapterId(Long chapterId) {
        ChapterEntity chapter = getChapterById(chapterId);
        return chapterRepository.findNextChapters(
                chapter.getVolume().getId(),
                chapter.getSequenceIndex()
        ).stream().findFirst().map(ChapterEntity::getId).orElse(null);
    }

    @Override
    public Long getPreviousChapterId(Long chapterId) {
        ChapterEntity chapter = getChapterById(chapterId);
        return chapterRepository.findPreviousChapters(
                chapter.getVolume().getId(),
                chapter.getSequenceIndex()
        ).stream().findFirst().map(ChapterEntity::getId).orElse(null);
    }

    // ============================================================
    // COMMON METHODS
    // ============================================================

    @Override
    public ChapterEntity getChapterById(Long chapterId) {
        return chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found."));
    }

    private ChapterStatus parseStatus(String raw, ChapterStatus fallback) {
        if (raw == null) return fallback;
        try {
            return ChapterStatus.valueOf(raw.toLowerCase());
        } catch (Exception e) {
            return fallback;
        }
    }

    private void processAndSaveContent(ChapterEntity chapter, String html) {

        if (html == null || html.isEmpty()) return;

        Document doc = Jsoup.parseBodyFragment(html);
        Elements imgs = doc.select("img");

        for (Element img : imgs) {
            String src = img.attr("src");
            if (src.startsWith("data:")) {
                String url = storageService.saveBase64Image(src);
                img.attr("src", url);
            }
        }

        String sanitized = Jsoup.clean(
                doc.body().html(),
                Safelist.relaxed()
        );

        String[] blocks = sanitized.split("(?i)(<br\\s*/?>\\s*){2,}");

        List<ChapterSegmentEntity> segs = new ArrayList<>();
        int seq = 1;
        for (String block : blocks) {
            if (block.trim().isEmpty()) continue;

            segs.add(ChapterSegmentEntity.builder()
                    .chapter(chapter)
                    .seq(seq++)
                    .segmentText(block)
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        chapterSegmentRepository.saveAll(segs);
    }

    // Unimplemented methods from interface (temporary)
    @Override
    public List<ChapterResponse> getChaptersByStory(Long storyId, Long authorId) {
        return List.of();
    }

    @Override
    public ChapterResponse getChapter(Long chapterId, Long authorId) {
        return null;
    }

    @Override
    public void deleteChapter(Long chapterId, Long authorId) {
    }

    @Override
    public ChapterResponse publishChapterNow(Long chapterId, Long authorId) {
        return null;
    }

    @Override
    public Map<String, Object> getChapterContent(Long chapterId) {
        return Map.of();
    }
}
