export const buildStoryFormData = (payload, coverFile) => {
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  if (coverFile) {
    formData.append("cover", coverFile);
  }
  return formData;
};

export const dedupeIds = (ids = []) => {
  const normalized = ids
    .map((id) => (id === "" || id === null || id === undefined ? null : Number(id)))
    .filter((id) => Number.isFinite(id));
  return Array.from(new Set(normalized));
};

export const stripHtml = (html = "") => {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

export const isEmptyHtml = (html = "") => {
  return stripHtml(html).trim().length === 0;
};

export const buildSegmentMap = (segments = []) => {
  let cursor = 0;
  return segments.map((segment) => {
    const text = stripHtml(segment.html || "");
    const startIndex = cursor;
    const length = text.length;
    cursor += length;
    return {
      segmentId: segment.id,
      startIndex,
      length,
    };
  });
};
