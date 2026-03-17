# Test Author Dashboard API

## Steps to test:

1. **Backend logs**: Start backend server and check console logs for:
   - "=== FETCHING STORIES ===" when frontend loads
   - "Found chapters for story X: Y" when mapping stories
   - "=== GETTING STORY CHAPTERS ===" when clicking "Xem chương"

2. **Frontend logs**: Open browser dev tools and check console for:
   - "=== TOGGLE EXPAND CLICKED ===" when clicking the expand button
   - "=== EXPAND CHAPTERS CLICKED ===" when expanding chapters
   - API response data

3. **Expected behavior**:
   - Story list should show correct chapter count (not 0)
   - Click "▼ Xem chương" should expand and show chapters
   - Chapters should display with title and edit/delete buttons

4. **Debug steps if not working**:
   - Check if backend is running on correct port
   - Check if user is authenticated (JWT token)
   - Check if story belongs to current author
   - Check if chapters have proper volume relationships

## Current fixes applied:
- Fixed field mapping (updatedAt → lastUpdated, title → chapterTitle)
- Added debug logging to both frontend and backend
- Simplified chapter query to use findByStoryId
- Added text to expand button ("▼ Xem chương")
- Fixed chapter count calculation

## Next steps:
1. Refresh the browser page
2. Check console logs for debug output
3. Try clicking "▼ Xem chương" button
4. Report any errors seen in console
