
package com.example.WebTruyen.service.impl;

import com.example.WebTruyen.dto.request.CreateChapterRequest;
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
import com.example.WebTruyen.service.StorageService; // Giả sử service này đã tồn tại
import lombok.RequiredArgsConstructor;
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
public class ChapterServiceImpl implements ChapterService {

    private final StoryRepository storyRepository;
    private final VolumeRepository volumeRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterSegmentRepository chapterSegmentRepository;
    private final StorageService storageService;

    // =========================================================================
    // LOGIC TỪ NHÁNH author-create-content (Xử lý Content HTML)
    // =========================================================================

    @Override
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

        // --- Process Content
        processAndSaveContent(savedChapter, req.getContentHtml());

        // --- prepare response
        CreateChapterResponse resp = new CreateChapterResponse();
        resp.setChapterId(savedChapter.getId());
        // Lấy lại segments đã lưu để trả về IDs (hoặc có thể optimize không cần query lại)
        List<ChapterSegmentEntity> savedSegs = chapterSegmentRepository.findByChapter_IdOrderBySeqAsc(savedChapter.getId());
        List<Long> ids = savedSegs.stream().map(ChapterSegmentEntity::getId).collect(Collectors.toList());
        resp.setSegmentIds(ids);
        resp.setSegmentCount(ids.size());
        return resp;
    }

    @Override
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

        // --- Update Content
        // Xóa cũ
        chapterSegmentRepository.deleteByChapter_Id(chapterId);
        chapterSegmentRepository.flush(); // Force execute delete

        // Thêm mới
        processAndSaveContent(chapter, req.getContentHtml());

        CreateChapterResponse resp = new CreateChapterResponse();
        resp.setChapterId(chapter.getId());
        List<ChapterSegmentEntity> savedSegs = chapterSegmentRepository.findByChapter_IdOrderBySeqAsc(chapter.getId());
        List<Long> ids = savedSegs.stream().map(ChapterSegmentEntity::getId).collect(Collectors.toList());
        resp.setSegmentIds(ids);
        resp.setSegmentCount(ids.size());
        return resp;
    }

    @Override
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

    // =========================================================================
    // HELPER METHODS (HTML Processing)
    // =========================================================================

    private void processAndSaveContent(ChapterEntity chapter, String contentHtml) {
        String replacedHtml = replaceBase64ImagesAndUpload(contentHtml);
        String sanitized = sanitizeHtml(replacedHtml);
        List<String> fragments = splitHtmlToBlocks(sanitized);

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
        if (!segs.isEmpty()) {
            chapterSegmentRepository.saveAll(segs);
        }
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

    private String replaceBase64ImagesAndUpload(String html) {
        if (html == null || html.isEmpty()) return html;
        Document doc = Jsoup.parseBodyFragment(html);
        Elements imgs = doc.select("img");
        for (Element img : imgs) {
            String src = img.attr("src");
            if (src != null && src.startsWith("data:")) {
                try {
                    String url = storageService.saveBase64Image(src);
                    if (url != null) img.attr("src", url);
                } catch (Exception ex) {
                    img.removeAttr("src");
                }
            }
        }
        return doc.body().html();
    }

    private String sanitizeHtml(String html) {
        if (html == null) return "";
        Safelist safelist = Safelist.relaxed()
                .addTags("span")
                .addAttributes("img", "src", "alt", "title", "width", "height")
                .addAttributes("a", "href", "title", "target");
        safelist.addProtocols("img", "src", "http", "https");
        return Jsoup.clean(html, "", safelist, new Document.OutputSettings().prettyPrint(false));
    }

    private List<String> splitHtmlToBlocks(String sanitizedHtml) {
        final String SEP = "<!--BLOCK_SEP-->";
        if (sanitizedHtml == null || sanitizedHtml.trim().isEmpty()) return Collections.emptyList();

        String normalized = sanitizedHtml.replaceAll("(?i)(<br\\s*/?>\\s*){2,}", SEP);
        normalized = normalized.replaceAll("(?i)</p>\\s*<p", "</p>" + SEP + "<p");
        normalized = normalized.replaceAll("(?i)<p>\\s*(?:<br\\s*/?>\\s*)*</p>", SEP);
        normalized = normalized.replaceAll("(?i)<div>\\s*(?:<br\\s*/?>\\s*)*</div>", SEP);

        String[] parts = normalized.split(Pattern.quote(SEP));
        List<String> result = new ArrayList<>();
        for (String part : parts) {
            String t = part.trim();
            if (t.isEmpty()) continue;
            if (!t.matches("(?i)^\\s*<(?:(p|div|h|ul|ol|li|blockquote)\\b).*")) {
                t = "<p>" + t + "</p>";
            }
            result.add(t);
        }
        return result;
    }


    // =========================================================================
    // LOGIC CŨ TỪ NHÁNH HEAD (Cần bạn implement cụ thể sau)
    // =========================================================================

    @Override
    public List<ChapterResponse> getChaptersByStory(Long storyId, Long authorId) {
        // TODO: Implement logic lấy danh sách chapter
        return List.of();
    }

    @Override
    public ChapterResponse getChapter(Long chapterId, Long authorId) {
        // TODO: Implement logic lấy 1 chapter (DTO)
        return null;
    }

    @Override
    public void deleteChapter(Long chapterId, Long authorId) {
        // TODO: Implement logic xóa mềm hoặc xóa cứng
    }

    @Override
    public ChapterResponse publishChapterNow(Long chapterId, Long authorId) {
        // TODO: Logic publish ngay lập tức
        return null;
    }

    @Override
    public ChapterEntity getChapterById(Long chapterId) {
        return chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
    }
}

//
//package com.example.WebTruyen.service.impl;
//
//
//import com.example.WebTruyen.dto.response.ChapterResponse;
//import com.example.WebTruyen.entity.model.Content.ChapterEntity;
//import com.example.WebTruyen.service.ChapterService;
//import org.springframework.stereotype.Service;
//import java.util.List;
//
//@Service // QUAN TRỌNG: Phải có dòng này thì lỗi mới hết
//public class ChapterServiceImpl implements ChapterService {
//
//    @Override
//    public List<ChapterResponse> getChaptersByStory(Long storyId, Long authorId) {
//        // Tạm thời để return null hoặc empty để test app
//        return List.of();
//    }
//
//    @Override
//    public ChapterResponse getChapter(Long chapterId, Long authorId) {
//        return null;
//    }
//
//    @Override
//    public void deleteChapter(Long chapterId, Long authorId) {
//    }
//
//    @Override
//    public ChapterResponse publishChapterNow(Long chapterId, Long authorId) {
//        return null;
//    }
//
//    @Override
//    public ChapterEntity getChapterById(Long chapterId) {
//        // Viết logic tìm chapter ở đây (ví dụ dùng ChapterRepository)
//        return null;
//    }
//}
