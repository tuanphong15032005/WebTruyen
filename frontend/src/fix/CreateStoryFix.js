// FILE PATCH CHO CreateStory.jsx
// Thay thế useEffect fetchTags (dòng 62-81) với code sau:

useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await storyService.getTags();
        console.log("Tags API response:", response);
        
        // API trả về array trực tiếp, không cần response.data
        const raw = Array.isArray(response) ? response : [];
        const list = raw.filter((tag) => tag && tag.id != null);
        const normalized = list
          .map((tag) => ({
            value: String(tag.id),
            label: tag.name || tag.title || String(tag.id),
          }));
        
        console.log("Normalized tags:", normalized);
        setTags(normalized);
        
        if (normalized.length === 0) {
          notify('Không tải được danh sách thể loại. Vui lòng thử lại.', 'error');
        }
      } catch (error) {
        console.error('getTags error', error);
        notify('Không tải được danh sách thể loại', 'error');
      }
    };
    fetchTags();
  }, [notify]);

// Cũng cần sửa lại phần fetchStory (dòng 97-105) để xử lý đúng:
// Thay thế:
const apiTags = Array.isArray(data.tags) ? data.tags : [];
const tagIdList = apiTags.map((tag) => String(tag.id));
if (tagIdList.length > 0) {
  setCategoryId(tagIdList[0]);
  setTagIds(tagIdList.slice(1));
} else {
  setCategoryId('');
  setTagIds([]);
}

// Bằng:
const apiTags = Array.isArray(data.tags) ? data.tags : [];
const tagIdList = apiTags.map((tag) => String(tag.id));
if (tagIdList.length > 0) {
  setCategoryId(tagIdList[0]);
  setTagIds(tagIdList.slice(1));
} else {
  setCategoryId('');
  setTagIds([]);
}
