import storyService from '../services/storyService';
import { getStoredUser } from './helpers';

const PRIVATE_STORY_MESSAGE = 'Truyện này hiện không còn công khai.';

export const getCurrentUserId = (user = getStoredUser()) => {
  const rawValue = user?.id ?? user?.userId ?? null;
  const normalizedValue = Number(rawValue);
  return Number.isFinite(normalizedValue) && normalizedValue > 0
    ? normalizedValue
    : null;
};

export const isPublishedStory = (story) =>
  String(story?.status || '')
    .trim()
    .toLowerCase() === 'published';

export const isStoryOwner = (story, user = getStoredUser()) => {
  const currentUserId = getCurrentUserId(user);
  const authorId = Number(story?.authorId ?? story?.author?.id ?? 0);
  return Boolean(currentUserId && authorId && currentUserId === authorId);
};

const buildPublicStoryTarget = ({
  storyId,
  chapterId = null,
  search = '',
  hash = '',
}) => {
  const normalizedSearch =
    typeof search === 'string' && search.trim() ? search.trim() : '';
  const normalizedHash =
    typeof hash === 'string' && hash.trim()
      ? `#${hash.trim().replace(/^#/, '')}`
      : '';

  if (chapterId) {
    return `/stories/${storyId}/chapters/${chapterId}${normalizedSearch}${normalizedHash}`;
  }

  return `/stories/${storyId}/metadata${normalizedSearch}${normalizedHash}`;
};

const buildAuthorStoryTarget = (storyId) =>
  storyId ? `/author/stories/${storyId}` : null;

const notifyPrivateStory = (notify) => {
  if (typeof notify === 'function') {
    notify(PRIVATE_STORY_MESSAGE, 'info');
  }
};

export const resolveImmediateStoryTarget = ({
  story,
  chapterId = null,
  search = '',
  hash = '',
  user = getStoredUser(),
}) => {
  const storyId = Number(story?.id ?? story?.storyId ?? 0);
  if (!Number.isFinite(storyId) || storyId <= 0) {
    return null;
  }

  if (isPublishedStory(story)) {
    return buildPublicStoryTarget({ storyId, chapterId, search, hash });
  }

  if (isStoryOwner(story, user)) {
    return buildAuthorStoryTarget(storyId);
  }

  return null;
};

export const navigateToStoryTarget = async ({
  navigate,
  notify,
  story = null,
  storyId = null,
  chapterId = null,
  search = '',
  hash = '',
  fallbackPath = null,
  replace = false,
}) => {
  const currentUser = getStoredUser();
  const normalizedStoryId = Number(story?.id ?? story?.storyId ?? storyId ?? 0);

  if (!Number.isFinite(normalizedStoryId) || normalizedStoryId <= 0) {
    return false;
  }

  const goToTarget = (targetPath) => {
    if (!targetPath) {
      return false;
    }
    navigate(targetPath, { replace });
    return true;
  };

  const immediateTarget = story
    ? resolveImmediateStoryTarget({
        story,
        chapterId,
        search,
        hash,
        user: currentUser,
      })
    : null;

  if (immediateTarget) {
    return goToTarget(immediateTarget);
  }

  if (story && !immediateTarget) {
    notifyPrivateStory(notify);
    if (fallbackPath) {
      navigate(fallbackPath, { replace });
    }
    return false;
  }

  try {
    await storyService.getPublicStory(normalizedStoryId);
    return goToTarget(
      buildPublicStoryTarget({
        storyId: normalizedStoryId,
        chapterId,
        search,
        hash,
      }),
    );
  } catch {
    if (currentUser?.token) {
      try {
        const privateStory = await storyService.getStory(normalizedStoryId);
        if (isStoryOwner(privateStory, currentUser)) {
          return goToTarget(buildAuthorStoryTarget(normalizedStoryId));
        }
      } catch {
        // Intentionally fall through to the blocked-state handling below.
      }
    }

    notifyPrivateStory(notify);
    if (fallbackPath) {
      navigate(fallbackPath, { replace });
    }
    return false;
  }
};
