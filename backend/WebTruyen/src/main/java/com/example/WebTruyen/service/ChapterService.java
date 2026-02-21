package com.example.WebTruyen.service;

// package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateChapterRequest;
import com.example.WebTruyen.dto.request.SaveChapterDraftRequest;
import com.example.WebTruyen.dto.response.CreateChapterResponse;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.ChapterSegmentEntity;
import com.example.WebTruyen.entity.model.Content.DraftEntity;
import com.example.WebTruyen.entity.model.Content.VolumeEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ChapterSegmentRepository;
import com.example.WebTruyen.repository.DraftRepository;
import com.example.WebTruyen.repository.VolumeRepository;
import com.example.WebTruyen.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Safelist;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChapterService {

    private final StoryRepository storyRepository;
    private final VolumeRepository volumeRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterSegmentRepository chapterSegmentRepository;
    private final DraftRepository draftRepository;
    private final StorageService storageService;

    /**
     * Tạo chapter từ HTML (Quill innerHTML).
     * - detect và upload base64 images -> replace src
     * - sanitize html
     * - split into segments (blank lines / empty paragraphs / multiple <br>)
     * - save chapter + segments
     * - trả về segmentIds
     */
    @Transactional
    public CreateChapterResponse createChapterFromHtml(UserEntity currentUser, Long storyId, Long volumeId, CreateChapterRequest req) {
        // --- validate volume & ownership
        VolumeEntity volume = volumeRepository.findById(volumeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Volume not found"));

        if (volume.getStory() == null || !volume.getStory().getId().equals(storyId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Volume does not belong to story");
        }

        StoryEntity story = volume.getStory();
        if (story.getAuthor() == null || !story.getAuthor().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not owner of story");
        }

        // --- pricing validation
        boolean isFree = req.getIsFree() == null ? true : req.getIsFree();
        if (!isFree && req.getPriceCoin() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "priceCoin required for paid chapter");
        }

        // --- create chapter row
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
                .status(req.getStatus() == null ? ChapterStatus.draft : ChapterStatus.valueOf(req.getStatus().toLowerCase()))
                .createdAt(LocalDateTime.now())
                .lastUpdateAt(LocalDateTime.now())
                .build();

        ChapterEntity savedChapter = chapterRepository.save(chapter);

        // --- handle base64 images inside contentHtml
        String contentHtml = req.getContentHtml();
        String replacedHtml = replaceBase64ImagesAndUpload(contentHtml);

        // --- sanitize HTML
        String sanitized = sanitizeHtml(replacedHtml);

        // --- split into fragments (segments)
        List<String> fragments = splitHtmlToBlocks(sanitized);

        // --- persist segments
        List<ChapterSegmentEntity> segs = new ArrayList<>();
        int seq = 1;
        for (String frag : fragments) {
            ChapterSegmentEntity s = ChapterSegmentEntity.builder()
                    .chapter(savedChapter)
                    .seq(seq++)
                    .segmentText(frag)
                    .createdAt(LocalDateTime.now())
                    .build();
            segs.add(s);
        }
        List<ChapterSegmentEntity> savedSegs = chapterSegmentRepository.saveAll(segs);

        // --- prepare response
        CreateChapterResponse resp = new CreateChapterResponse();
        resp.setChapterId(savedChapter.getId());
        List<Long> ids = savedSegs.stream().map(ChapterSegmentEntity::getId).collect(Collectors.toList());
        resp.setSegmentIds(ids);
        resp.setSegmentCount(ids.size());
        return resp;
    }

    @Transactional
    public CreateChapterResponse updateChapterFromHtml(UserEntity currentUser, Long storyId, Long volumeId, Long chapterId, CreateChapterRequest req) {
        VolumeEntity volume = volumeRepository.findById(volumeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Volume not found"));

        if (volume.getStory() == null || !volume.getStory().getId().equals(storyId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Volume does not belong to story");
        }

        StoryEntity story = volume.getStory();
        if (story.getAuthor() == null || !story.getAuthor().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not owner of story");
        }

        ChapterEntity chapter = chapterRepository.findByIdAndVolume_Id(chapterId, volumeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));

        boolean isFree = req.getIsFree() == null ? true : req.getIsFree();
        if (!isFree && req.getPriceCoin() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "priceCoin required for paid chapter");
        }

        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        chapter.setTitle(req.getTitle().trim());
        chapter.setFree(isFree);
        chapter.setPriceCoin(req.getPriceCoin());
        ChapterStatus nextStatus = parseStatus(req.getStatus(), chapter.getStatus());
        chapter.setStatus(nextStatus);
        chapter.setLastUpdateAt(LocalDateTime.now());
        chapterRepository.save(chapter);

        String contentHtml = req.getContentHtml();
        String replacedHtml = replaceBase64ImagesAndUpload(contentHtml);
        String sanitized = sanitizeHtml(replacedHtml);
        List<String> fragments = splitHtmlToBlocks(sanitized);

        chapterSegmentRepository.deleteByChapter_Id(chapterId);
        // Force delete SQL execution before re-insert to avoid uq(chapter_id, seq) collision.
        chapterSegmentRepository.flush();
        List<ChapterSegmentEntity> segs = new ArrayList<>();
        int seq = 1;
        for (String frag : fragments) {
            ChapterSegmentEntity s = ChapterSegmentEntity.builder()
                    .chapter(chapter)
                    .seq(seq++)
                    .segmentText(frag)
                    .createdAt(LocalDateTime.now())
                    .build();
            segs.add(s);
        }
        List<ChapterSegmentEntity> savedSegs = segs.isEmpty()
                ? Collections.emptyList()
                : chapterSegmentRepository.saveAll(segs);

        CreateChapterResponse resp = new CreateChapterResponse();
        resp.setChapterId(chapter.getId());
        List<Long> ids = savedSegs.stream().map(ChapterSegmentEntity::getId).collect(Collectors.toList());
        resp.setSegmentIds(ids);
        resp.setSegmentCount(ids.size());
        return resp;
    }

    private ChapterStatus parseStatus(String raw, ChapterStatus fallback) {
        if (raw == null || raw.trim().isEmpty()) {
            return fallback == null ? ChapterStatus.draft : fallback;
        }
        try {
            return ChapterStatus.valueOf(raw.trim().toLowerCase());
        } catch (IllegalArgumentException ex) {
            return fallback == null ? ChapterStatus.draft : fallback;
        }
    }

    /**
     * Replace any <img src="data:..."> with uploaded URL via StorageService.saveBase64Image(...)
     * Returns replaced HTML.
     */
    private String replaceBase64ImagesAndUpload(String html) {
        if (html == null || html.isEmpty()) return html;
        Document doc = Jsoup.parseBodyFragment(html);
        Elements imgs = doc.select("img");
        for (Element img : imgs) {
            String src = img.attr("src");
            if (src != null && src.startsWith("data:")) {
                // upload and replace
                try {
                    String url = storageService.saveBase64Image(src);
                    if (url != null) img.attr("src", url);
                } catch (Exception ex) {
                    // nếu upload fail, remove img để tránh lưu base64
                    img.removeAttr("src");
                }
            }
        }
        // return body inner html
        return doc.body().html();
    }

    /**
     * Sanitize HTML using Jsoup Safelist.relaxed (allow images, links, etc.)
     */
    private String sanitizeHtml(String html) {
        if (html == null) return "";
        Safelist safelist = Safelist.relaxed()
                .addTags("span")
                .addAttributes("img", "src", "alt", "title", "width", "height")
                .addAttributes("a", "href", "title", "target");
        safelist.addProtocols("img", "src", "http", "https");
        String cleaned = Jsoup.clean(html, "", safelist, new Document.OutputSettings().prettyPrint(false));
        return cleaned;
    }

    /**
     * Split sanitized HTML into blocks per rules:
     * - split on sequences of <br> (2 or more)
     * - split at </p><p> boundaries
     * - treat empty paragraphs/divs as separators
     * Returns list of HTML fragments (each fragment preserved inline tags)
     */
    private List<String> splitHtmlToBlocks(String sanitizedHtml) {
        final String SEP = "<!--BLOCK_SEP-->";
        if (sanitizedHtml == null || sanitizedHtml.trim().isEmpty()) return Collections.emptyList();

        // 1) normalize sequences of <br>
        String normalized = sanitizedHtml.replaceAll("(?i)(<br\\s*/?>\\s*){2,}", SEP);

        // 2) p boundary
        normalized = normalized.replaceAll("(?i)</p>\\s*<p", "</p>" + SEP + "<p");

        // 3) empty p/div
        normalized = normalized.replaceAll("(?i)<p>\\s*(?:<br\\s*/?>\\s*)*</p>", SEP);
        normalized = normalized.replaceAll("(?i)<div>\\s*(?:<br\\s*/?>\\s*)*</div>", SEP);

        // 4) split
        String[] parts = normalized.split(Pattern.quote(SEP));
        List<String> result = new ArrayList<>();
        for (String part : parts) {
            String t = part.trim();
            if (t.isEmpty()) continue;
            // if fragment does not start with block-level tag, wrap with <p>
            if (!t.matches("(?i)^\\s*<(?:(p|div|h|ul|ol|li|blockquote)\\b).*")) {
                t = "<p>" + t + "</p>";
            }
            result.add(t);
        }
        return result;
    }

    /**
     * Return segments list and fullHtml for reader/editor.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getChapterContent(Long chapterId) {
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        List<ChapterSegmentEntity> segs = chapterSegmentRepository.findByChapter_IdOrderBySeqAsc(chapterId);
        StringBuilder sb = new StringBuilder();
        List<Map<String,Object>> segDtos = new ArrayList<>();
        for (ChapterSegmentEntity s : segs) {
            sb.append(s.getSegmentText());
            Map<String,Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("seq", s.getSeq());
            m.put("html", s.getSegmentText());
            segDtos.add(m);
        }
        Map<String,Object> out = new HashMap<>();
        out.put("chapterId", chapter.getId());
        out.put("volumeId", chapter.getVolume() != null ? chapter.getVolume().getId() : null);
        out.put("sequenceIndex", chapter.getSequenceIndex());
        out.put("title", chapter.getTitle());
        out.put("isFree", chapter.isFree());
        out.put("priceCoin", chapter.getPriceCoin());
        out.put("status", chapter.getStatus() != null ? chapter.getStatus().name() : null);
        out.put("segments", segDtos);
        out.put("fullHtml", sb.toString());
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getChapterDraft(UserEntity currentUser, Long storyId, Long volumeId, Long chapterId) {
        ChapterEntity chapter = requireOwnedChapter(currentUser, storyId, volumeId, chapterId);
        DraftEntity draft = draftRepository.findById(chapter.getId()).orElse(null);

        Map<String, Object> out = new HashMap<>();
        out.put("hasDraft", draft != null);
        out.put("chapterId", chapter.getId());
        out.put("content", draft != null ? draft.getContent() : null);
        out.put("createdAt", draft != null ? draft.getCreatedAt() : null);
        out.put("updatedAt", draft != null ? draft.getUpdatedAt() : null);
        return out;
    }

    @Transactional
    public Map<String, Object> upsertChapterDraft(
            UserEntity currentUser,
            Long storyId,
            Long volumeId,
            Long chapterId,
            SaveChapterDraftRequest req
    ) {
        ChapterEntity chapter = requireOwnedChapter(currentUser, storyId, volumeId, chapterId);
        DraftEntity draft = draftRepository.findById(chapter.getId()).orElse(null);
        if (draft == null) {
            draft = DraftEntity.builder()
                    .chapter(chapter)
                    .content(req != null ? req.getDraftContent() : null)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        } else {
            draft.setContent(req != null ? req.getDraftContent() : null);
            draft.setUpdatedAt(LocalDateTime.now());
        }
        DraftEntity saved = draftRepository.save(draft);

        Map<String, Object> out = new HashMap<>();
        out.put("hasDraft", true);
        out.put("chapterId", chapter.getId());
        out.put("content", saved.getContent());
        out.put("createdAt", saved.getCreatedAt());
        out.put("updatedAt", saved.getUpdatedAt());
        return out;
    }

    @Transactional
    public void deleteChapterDraft(UserEntity currentUser, Long storyId, Long volumeId, Long chapterId) {
        requireOwnedChapter(currentUser, storyId, volumeId, chapterId);
        draftRepository.deleteById(chapterId);
    }

    private ChapterEntity requireOwnedChapter(UserEntity currentUser, Long storyId, Long volumeId, Long chapterId) {
        VolumeEntity volume = volumeRepository.findById(volumeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Volume not found"));

        if (volume.getStory() == null || !volume.getStory().getId().equals(storyId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Volume does not belong to story");
        }

        StoryEntity story = volume.getStory();
        if (story.getAuthor() == null || !story.getAuthor().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not owner of story");
        }

        return chapterRepository.findByIdAndVolume_Id(chapterId, volumeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
    }
}
