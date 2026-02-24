// Debug utility for chapter navigation issues
export const debugChapterNavigation = (chapterId, chapter, allChapters) => {
  console.group('🔍 Chapter Navigation Debug');
  console.log('Current chapterId:', chapterId);
  console.log('Chapter data:', chapter);
  console.log('All chapters:', allChapters);
  
  if (chapter) {
    console.log('Next chapter ID:', chapter.nextChapterId);
    console.log('Previous chapter ID:', chapter.previousChapterId);
    console.log('Sequence index:', chapter.sequenceIndex);
  }
  
  // Check if chapters are properly ordered
  if (allChapters.length > 0) {
    console.log('Chapters order:');
    allChapters.forEach((ch, index) => {
      console.log(`  ${index + 1}. ID: ${ch.id}, Seq: ${ch.sequenceIndex}, Title: ${ch.title}`);
    });
  }
  
  console.groupEnd();
};

export const debugURLParams = () => {
  const params = new URLSearchParams(window.location.search);
  console.log('📍 Current URL params:', Object.fromEntries(params.entries()));
};
