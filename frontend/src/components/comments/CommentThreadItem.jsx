import React from 'react';

const noop = () => {};

const CommentThreadItem = ({
  comment,
  isReply = false,
  rootId = null,
  currentUserId = 0,
  formatTime = () => '',
  getInitial = () => '?',
  onUserClick = noop,
  onReply = noop,
  onStartEdit = noop,
  onDelete = noop,
  onReport = noop,
  editingCommentId = null,
  editingContent = '',
  onEditingContentChange = noop,
  savingComment = false,
  onSaveEdit = noop,
  onCancelEdit = noop,
  replyForm = null,
  enableSpoilers = false,
  isSpoilerRevealed = false,
  onRevealSpoiler = noop,
  editingHasSpoiler = false,
  onEditingHasSpoilerChange = noop,
  allowOwnerReport = false,
}) => {
  const commentRootId = String(rootId || comment?.id || '');
  const isOwner = currentUserId === Number(comment?.userId);
  const mention =
    isReply && comment?.parentUsername ? `@${comment.parentUsername} ` : '';
  const isHidden = Boolean(comment?.hidden);
  const isSpoiler = enableSpoilers && Boolean(comment?.spoiler);
  const isEditing = editingCommentId === comment?.id;
  const username = comment?.username || 'Unknown';

  return (
    <article
      className={isReply ? 'story-metadata__reply-item' : 'story-metadata__comment-item'}
    >
      <div className='story-metadata__comment-avatar-wrap'>
        {comment?.avatarUrl ? (
          <img src={comment.avatarUrl} alt={username} />
        ) : (
          <div className='story-metadata__comment-avatar-fallback'>
            {getInitial(username)}
          </div>
        )}
      </div>

      <div className='story-metadata__comment-body'>
        <div className='story-metadata__comment-head'>
          <strong
            className='cursor-pointer hover:text-blue-600 transition-colors'
            onClick={() => onUserClick(comment)}
          >
            {username}
          </strong>
          <small>{formatTime(comment?.createdAt)}</small>
        </div>

        {isEditing ? (
          <div className='story-metadata__edit-form'>
            <textarea
              value={editingContent}
              onChange={(event) => onEditingContentChange(event.target.value)}
              maxLength={4000}
            />
            {enableSpoilers && (
              <label className='story-metadata__spoiler-toggle'>
                <input
                  type='checkbox'
                  checked={editingHasSpoiler}
                  onChange={(event) =>
                    onEditingHasSpoilerChange(event.target.checked)
                  }
                />
                <span>Chứa spoil</span>
              </label>
            )}
            <div className='story-metadata__edit-actions'>
              <button
                type='button'
                disabled={savingComment}
                onClick={() => onSaveEdit(comment?.id)}
              >
                {savingComment ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button type='button' className='ghost' onClick={onCancelEdit}>
                Hủy
              </button>
            </div>
          </div>
        ) : isHidden ? (
          <p className='story-metadata__content-mask story-metadata__content-mask--hidden'>
            Bình luận đã bị ẩn do vi phạm tiêu chuẩn cộng đồng.
          </p>
        ) : isSpoiler && !isSpoilerRevealed ? (
          <div className='story-metadata__content-mask-wrap'>
            <p className='story-metadata__content-mask'>
              Bình luận này có chứa spoiler.
            </p>
            <button
              type='button'
              className='story-metadata__reveal-btn'
              onClick={() => onRevealSpoiler(comment)}
            >
              Hiện bình luận
            </button>
          </div>
        ) : (
          <p>
            {mention && <span className='story-metadata__mention'>{mention}</span>}
            {comment?.content}
          </p>
        )}

        {!isEditing && !isHidden && (
          <div className='story-metadata__comment-actions'>
            <button
              type='button'
              className='story-metadata__reply-btn'
              onClick={() => onReply(comment, commentRootId)}
            >
              Trả lời
            </button>

            {isOwner && (
              <>
                <button
                  type='button'
                  className='story-metadata__inline-action'
                  onClick={() => onStartEdit(comment)}
                >
                  Chỉnh sửa
                </button>
                <button
                  type='button'
                  className='story-metadata__inline-action danger'
                  onClick={() => onDelete(comment?.id)}
                >
                  Xóa
                </button>
              </>
            )}

            {(!isOwner || allowOwnerReport) && (
              <button
                type='button'
                className='story-metadata__inline-action'
                onClick={() =>
                  onReport(comment?.id, comment?.content, comment?.username)
                }
              >
                Báo cáo
              </button>
            )}
          </div>
        )}

        {replyForm}
      </div>
    </article>
  );
};

export default CommentThreadItem;
