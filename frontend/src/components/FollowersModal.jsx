import React from 'react';
import { X, User, Calendar } from 'lucide-react';

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--theme-overlay)',
  },
  panel: {
    width: '90%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'hidden',
    border: '1px solid var(--theme-border)',
    borderRadius: '16px',
    background: 'var(--theme-modal-bg)',
    boxShadow: 'var(--shadow-lg)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px',
    borderBottom: '1px solid var(--theme-divider)',
  },
  title: {
    margin: 0,
    color: 'var(--theme-text-primary)',
    fontSize: '24px',
    fontWeight: '700',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    border: '1px solid transparent',
    borderRadius: '8px',
    background: 'none',
    color: 'var(--theme-text-secondary)',
    cursor: 'pointer',
  },
  content: {
    maxHeight: '60vh',
    overflowY: 'auto',
    padding: '16px',
  },
  centeredState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: 'var(--theme-text-secondary)',
  },
  emptyState: {
    padding: '40px',
    color: 'var(--theme-text-secondary)',
    textAlign: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    border: '1px solid var(--theme-border)',
    borderRadius: '12px',
    background: 'var(--theme-surface-base)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  avatar: {
    width: '48px',
    height: '48px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: '50%',
    background: 'var(--theme-accent)',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  identityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  identityText: {
    color: 'var(--theme-text-primary)',
    fontSize: '16px',
    fontWeight: '600',
  },
  badge: {
    padding: '2px 8px',
    border: '1px solid var(--theme-info-border)',
    borderRadius: '999px',
    background: 'var(--theme-info-soft)',
    color: 'var(--theme-info-text)',
    fontSize: '12px',
    fontWeight: '500',
  },
  secondaryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    color: 'var(--theme-text-secondary)',
    fontSize: '14px',
  },
  followDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
    color: 'var(--theme-text-muted)',
    fontSize: '12px',
  },
};

export default function FollowersModal({ isOpen, onClose, followers, loading }) {
  const followerItems = Array.isArray(followers) ? followers : [];

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 style={styles.title}>Danh sách người theo dõi ({followerItems.length})</h2>
          <button
            onClick={onClose}
            style={styles.closeButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--theme-surface-hover)';
              e.currentTarget.style.color = 'var(--theme-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--theme-text-secondary)';
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.centeredState}>Đang tải...</div>
          ) : followerItems.length === 0 ? (
            <div style={styles.emptyState}>
              <User size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>Chưa có người theo dõi nào</p>
            </div>
          ) : (
            <div style={styles.list}>
              {followerItems.map((follower) => (
                <div
                  key={follower.userId}
                  style={styles.item}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--theme-surface-hover)';
                    e.currentTarget.style.borderColor = 'var(--theme-border-strong)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--theme-surface-base)';
                    e.currentTarget.style.borderColor = 'var(--theme-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => {
                    window.location.href = `/portfolio/${follower.userId}`;
                  }}
                >
                  <div style={styles.avatar}>
                    {follower.avatarUrl ? (
                      <img
                        src={follower.avatarUrl}
                        alt="Ảnh đại diện"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      (follower.displayName || follower.username || '?').charAt(0).toUpperCase()
                    )}
                  </div>

                  <div style={styles.info}>
                    <div style={styles.identityRow}>
                      <span style={styles.identityText}>
                        {follower.displayName || follower.username}
                      </span>
                      {follower.isAuthor && <span style={styles.badge}>Tác giả</span>}
                    </div>

                    <div style={styles.secondaryRow}>
                      <span>@{follower.username}</span>
                      {follower.authorPenName && (
                        <span style={{ fontStyle: 'italic' }}>"{follower.authorPenName}"</span>
                      )}
                    </div>

                    {follower.followDate && (
                      <div style={styles.followDate}>
                        <Calendar size={12} />
                        <span>Theo dõi từ {follower.followDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
