package com.example.WebTruyen.service.impl;

import com.example.WebTruyen.dto.request.CreateChapterRequest;
import com.example.WebTruyen.dto.response.ChapterDetailResponse;
import com.example.WebTruyen.dto.response.ChapterResponse;
import com.example.WebTruyen.dto.response.CreateChapterResponse;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.keys.ReadingHistoryId;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.ChapterSegmentEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.Content.VolumeEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.ReadingHistoryEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ChapterSegmentRepository;
import com.example.WebTruyen.repository.ReadingHistoryRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.VolumeRepository;
import com.example.WebTruyen.repository.ChapterUnlockRepository;
import com.example.WebTruyen.service.ChapterService;
import com.example.WebTruyen.service.StorageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.safety.Safelist;
import org.jsoup.select.Elements;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
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
    private final ChapterUnlockRepository chapterUnlockRepository;
    private final ReadingHistoryRepository readingHistoryRepository;
    private final UserRepository userRepository;
    private static final Set<String> SEGMENT_BLOCK_TAGS = Set.of(
            "p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "li", "div"
    );

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
    public ChapterDetailResponse getChapterDetail(Long chapterId, Long userId) {

        ChapterEntity chapter = getChapterById(chapterId);

        // Check if chapter is unlocked for the user
        boolean isUnlocked = chapter.isFree();
        if (!isUnlocked && userId != null) {
            isUnlocked = chapterUnlockRepository.existsByUserIdAndChapterId(userId, chapterId);
        }

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
                .unlocked(isUnlocked)
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
        // Hieu Son – ngày 25/02/2026
        // [Sua logic next chapter: di theo thu tu toan story (volume -> chapter -> id), khong gioi han trong 1 volume - V2 - branch: minhfinal2]
        ChapterEntity chapter = getChapterById(chapterId);
        //get strId của chapter
        Long storyId = chapter.getVolume() != null && chapter.getVolume().getStory() != null
                ? chapter.getVolume().getStory().getId()
                : null;
        if (storyId == null) return null;
        //Lấy thứ tự của volume trong strid vừa lấy
        Integer currentVolumeSequence = chapter.getVolume().getSequenceIndex() != null
                ? chapter.getVolume().getSequenceIndex()
                : Integer.MAX_VALUE; //nếu không có - đưa về cuối dể so sánh.
        //Lấy thứ tự của chapter trong vlum
        Integer currentChapterSequence = chapter.getSequenceIndex() != null
                ? chapter.getSequenceIndex()
                : Integer.MAX_VALUE; //tương tự
        //query
        return chapterRepository.findNextChaptersInStory(
                        storyId,
                        currentVolumeSequence,
                        currentChapterSequence,
                        chapter.getId(),
                        PageRequest.of(0, 1)
                ).stream()
                .filter(c -> ChapterStatus.published.equals(c.getStatus()))
                .findFirst()
                .map(ChapterEntity::getId)
                .orElse(null);
    }

    @Override
    public Long getPreviousChapterId(Long chapterId) {
        // Hieu Son – ngày 25/02/2026
        // [Sua logic previous chapter: di theo thu tu toan story (volume -> chapter -> id), khong gioi han trong 1 volume - V2 - branch: minhfinal2]
        ChapterEntity chapter = getChapterById(chapterId);
        Long storyId = chapter.getVolume() != null && chapter.getVolume().getStory() != null
                ? chapter.getVolume().getStory().getId()
                : null;
        if (storyId == null) return null;
      Integer currentVolumeSequence = chapter.getVolume().getSequenceIndex() != null
                ? chapter.getVolume().getSequenceIndex()
                : Integer.MAX_VALUE;
        Integer currentChapterSequence = chapter.getSequenceIndex() != null
                ? chapter.getSequenceIndex()
                : Integer.MAX_VALUE;

        return chapterRepository.findPreviousChaptersInStory(
                        storyId,
                        currentVolumeSequence,
                        currentChapterSequence,
                        chapter.getId(),
                        PageRequest.of(0, 1)
                ).stream()
                .filter(c -> ChapterStatus.published.equals(c.getStatus()))
                .findFirst()
                .map(ChapterEntity::getId)
                .orElse(null);
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

        if (html == null || html.isBlank()) {
            return;
        }

        Document rawDoc = Jsoup.parseBodyFragment(html);
        for (Element img : rawDoc.select("img")) {
            String src = img.attr("src");
            if (src != null && src.startsWith("data:")) {
                String uploadedUrl = storageService.saveBase64Image(src);
                if (uploadedUrl != null && !uploadedUrl.isBlank()) {
                    img.attr("src", uploadedUrl);
                }
            }
        }

        String sanitizedHtml = Jsoup.clean(rawDoc.body().html(), Safelist.relaxed());
        Document cleanDoc = Jsoup.parseBodyFragment(sanitizedHtml);
        Element cleanBody = cleanDoc.body();

        List<String> segmentHtmlList = new ArrayList<>();
        for (Element block : cleanBody.children()) {
            String tagName = block.tagName().toLowerCase(Locale.ROOT);
            if ("img".equals(tagName)) {
                appendSegmentIfMeaningful(block.outerHtml(), segmentHtmlList);
                continue;
            }

            if (SEGMENT_BLOCK_TAGS.contains(tagName)) {
                extractSegmentsFromBlock(block, segmentHtmlList);
                continue;
            }

            appendSegmentIfMeaningful(block.outerHtml(), segmentHtmlList);
        }

        if (segmentHtmlList.isEmpty()) {
            for (String rawLine : sanitizedHtml.split("(?i)<br\\s*/?>")) {
                appendSegmentIfMeaningful(rawLine, segmentHtmlList);
            }
        }

        if (segmentHtmlList.isEmpty()) {
            return;
        }

        List<ChapterSegmentEntity> entities = new ArrayList<>();
        int seq = 1;
        for (String segmentHtml : segmentHtmlList) {
            entities.add(ChapterSegmentEntity.builder()
                    .chapter(chapter)
                    .seq(seq++)
                    .segmentText(segmentHtml)
                    .createdAt(LocalDateTime.now())
                    .build());
        }
        chapterSegmentRepository.saveAll(entities);
    }

    private void extractSegmentsFromBlock(Element block, List<String> segmentHtmlList) {
        String blockTag = block.tagName().toLowerCase(Locale.ROOT);
        String innerHtml = block.html();

        if (!innerHtml.toLowerCase(Locale.ROOT).contains("<br") && block.select("img").isEmpty()) {
            appendSegmentIfMeaningful(block.outerHtml(), segmentHtmlList);
            return;
        }

        if (block.select("img").isEmpty()) {
            String[] lines = innerHtml.split("(?i)<br\\s*/?>");
            for (String line : lines) {
                String wrapped = "<" + blockTag + ">" + line + "</" + blockTag + ">";
                appendSegmentIfMeaningful(wrapped, segmentHtmlList);
            }
            return;
        }

        StringBuilder buffer = new StringBuilder();
        for (Node node : block.childNodes()) {
            if (node instanceof Element elementNode) {
                String tag = elementNode.tagName().toLowerCase(Locale.ROOT);
                if ("br".equals(tag)) {
                    flushTextBufferAsSegment(blockTag, buffer, segmentHtmlList);
                    continue;
                }
                if ("img".equals(tag)) {
                    flushTextBufferAsSegment(blockTag, buffer, segmentHtmlList);
                    appendSegmentIfMeaningful(elementNode.outerHtml(), segmentHtmlList);
                    continue;
                }
            }

            buffer.append(node.outerHtml());
        }
        flushTextBufferAsSegment(blockTag, buffer, segmentHtmlList);
    }

    private void flushTextBufferAsSegment(
            String tagName,
            StringBuilder buffer,
            List<String> segmentHtmlList
    ) {
        String html = buffer.toString().trim();
        buffer.setLength(0);
        if (html.isEmpty()) {
            return;
        }
        appendSegmentIfMeaningful("<" + tagName + ">" + html + "</" + tagName + ">", segmentHtmlList);
    }

    private void appendSegmentIfMeaningful(String html, List<String> segmentHtmlList) {
        if (html == null || html.isBlank()) {
            return;
        }

        String sanitized = Jsoup.clean(html, Safelist.relaxed()).trim();
        if (sanitized.isEmpty()) {
            return;
        }

        Document doc = Jsoup.parseBodyFragment(sanitized);
        boolean hasImage = !doc.select("img").isEmpty();
        String text = doc.text().replace('\u00A0', ' ').trim();
        if (!hasImage && text.isEmpty()) {
            return;
        }

        segmentHtmlList.add(sanitized);
    }

    // Unimplemented methods from interface (temporary)
    @Override
    @Transactional(readOnly = true)
    public List<ChapterResponse> getChaptersByStory(Long storyId, Long authorId) {
        // Hieu Son – ngày 25/02/2026
        // [Chot thu tu chapter fallback o service theo volume -> chapter -> id de on dinh khi trung sequenceIndex - V2 - branch: minhfinal2]
        return chapterRepository.findByStoryId(storyId)
                .stream()
                .filter(chapter -> chapter.getStatus() == ChapterStatus.published)
                .sorted(Comparator
                        .comparing(
                                (ChapterEntity chapter) -> chapter.getVolume() != null
                                        && chapter.getVolume().getSequenceIndex() != null
                                        ? chapter.getVolume().getSequenceIndex()
                                        : Integer.MAX_VALUE
                        )
                        .thenComparing(chapter -> chapter.getSequenceIndex() != null
                                ? chapter.getSequenceIndex()
                                : Integer.MAX_VALUE)
                        .thenComparing(chapter -> chapter.getId() != null
                                ? chapter.getId()
                                : Long.MAX_VALUE))
                .map(this::toChapterResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ChapterResponse getChapter(Long chapterId, Long authorId) {
        ChapterEntity chapter = getChapterById(chapterId);
        if (authorId != null) {
            Long ownerId = chapter.getVolume().getStory().getAuthor().getId();
            if (!Objects.equals(ownerId, authorId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not owner");
            }
        }
        return toChapterResponse(chapter);
    }

    @Override
    @Transactional
    public void deleteChapter(Long chapterId, Long authorId) {
        ChapterEntity chapter = getChapterById(chapterId);
        if (authorId != null) {
            Long ownerId = chapter.getVolume().getStory().getAuthor().getId();
            if (!Objects.equals(ownerId, authorId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not owner");
            }
        }
        chapterSegmentRepository.deleteByChapter_Id(chapterId);
        chapterRepository.delete(chapter);
    }

    @Override
    @Transactional
    public ChapterResponse publishChapterNow(Long chapterId, Long authorId) {
        ChapterEntity chapter = getChapterById(chapterId);
        if (authorId != null) {
            Long ownerId = chapter.getVolume().getStory().getAuthor().getId();
            if (!Objects.equals(ownerId, authorId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not owner");
            }
        }

        chapter.setStatus(ChapterStatus.published);
        chapter.setLastUpdateAt(LocalDateTime.now());
        chapterRepository.save(chapter);
        return toChapterResponse(chapter);
    }

    @Override
    public Map<String, Object> getChapterContent(Long chapterId) {
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        
        // Get all segments for this chapter
        List<ChapterSegmentEntity> segments = chapterSegmentRepository.findByChapter_IdOrderBySeqAsc(chapterId);
        
        // Build full HTML from segments
        StringBuilder fullHtml = new StringBuilder();
        for (ChapterSegmentEntity segment : segments) {
            fullHtml.append(segment.getSegmentText()).append("\n");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", chapter.getId());
        result.put("title", chapter.getTitle() != null ? chapter.getTitle() : "");
        result.put("isFree", chapter.isFree());
        result.put("priceCoin", chapter.getPriceCoin());
        result.put("status", chapter.getStatus() != null ? chapter.getStatus().toString() : "draft");
        result.put("contentDelta", "");
        result.put("fullHtml", fullHtml.toString());
        result.put("sequenceIndex", chapter.getSequenceIndex());
        result.put("volumeId", chapter.getVolume() != null ? chapter.getVolume().getId() : null);
        
        return result;
    }
//<<<<<<< HEAD

    private ChapterResponse toChapterResponse(ChapterEntity chapter) {
        if (chapter == null) {
            return null;
        }

        return ChapterResponse.builder()
                .id(chapter.getId())
                .storyId(chapter.getVolume() != null && chapter.getVolume().getStory() != null
                        ? chapter.getVolume().getStory().getId()
                        : null)
                .volumeId(chapter.getVolume() != null ? chapter.getVolume().getId() : null)
                .title(chapter.getTitle())
                .content(null)
                .free(chapter.isFree())
                .priceCoin(chapter.getPriceCoin())
                .status(chapter.getStatus())
                .sequenceIndex(chapter.getSequenceIndex())
                .createdAt(chapter.getCreatedAt())
                .lastUpdateAt(chapter.getLastUpdateAt())
                .scheduledPublishAt(null)
                .build();
    }

    @Override
    @Transactional
    public void recordChapterView(Long chapterId, Long userId) {
        ChapterEntity chapter = getChapterById(chapterId);
        StoryEntity story = chapter.getVolume().getStory();
        Long storyId = story != null ? story.getId() : null;
        if (storyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Story not found for chapter");
        }

        storyRepository.incrementViewCount(storyId);

        if (userId == null) {
            return;
        }

        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return;
        }
        //record + lưu lịch sử đọc mới nhất cho user
        ReadingHistoryEntity history = readingHistoryRepository
                .findById_UserIdAndId_StoryId(userId, storyId)
                .orElseGet(() -> ReadingHistoryEntity.builder()
                        .id(new ReadingHistoryId(userId, storyId))
                        .user(user)
                        .story(story)
                        .build());
        history.setLastChapter(chapter);
        readingHistoryRepository.save(history);
    }
//=======
//>>>>>>> origin/minhfinal1
}
