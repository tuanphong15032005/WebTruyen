import React from 'react';
import { useNavigate } from 'react-router-dom';

const mockNovels = [
    {
        id: 1,
        title: 'Ma Đạo Tổ Sư',
        author: 'Mặc Hương Đồng Khứu',
        tags: ['Huyền huyễn', 'Tu tiên'],
        coverUrl: 'https://picsum.photos/seed/novel-1/240/320',
        views: 1203456,
    },
    {
        id: 2,
        title: 'Đấu Phá Thương Khung',
        author: 'Thiên Tằm Thổ Đậu',
        tags: ['Huyền huyễn', 'Nhiệt huyết'],
        coverUrl: 'https://picsum.photos/seed/novel-2/240/320',
        views: 987654,
    },
    {
        id: 3,
        title: 'Toàn Chức Cao Thủ',
        author: 'Hồ Điệp Lam',
        tags: ['Esports', 'Đô thị'],
        coverUrl: 'https://picsum.photos/seed/novel-3/240/320',
        views: 654321,
    },
    {
        id: 4,
        title: 'Thế Giới Hoàn Mỹ',
        author: 'Thần Đông',
        tags: ['Huyền huyễn', 'Tiên hiệp'],
        coverUrl: 'https://picsum.photos/seed/novel-4/240/320',
        views: 432198,
    },
];

function HomePage() {
    const navigate = useNavigate();

    const handleNovelClick = () => {
        navigate('/novel/1');
    };

    const handleRankingClick = () => {
        navigate('/ranking');
    };

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h1 style={{ margin: 0 }}>Trang Chủ</h1>
                <button
                    type="button"
                    onClick={handleRankingClick}
                    style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #3b3b3b',
                        background: '#1b1b1b',
                        color: 'white',
                        cursor: 'pointer',
                    }}
                >
                    Xem Bảng Xếp Hạng
                </button>
            </div>

            <div
                onClick={handleRankingClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRankingClick();
                }}
                style={{
                    marginTop: 16,
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid #333',
                    background: 'linear-gradient(135deg, #2a2a2a, #1c1c1c)',
                    cursor: 'pointer',
                }}
            >
                <div style={{ fontSize: 14, opacity: 0.85 }}>Khu vực nổi bật</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>Bảng xếp hạng truyện</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                    Click để xem top truyện theo lượt xem, lượt thích, đánh giá...
                </div>
            </div>

            <h2 style={{ marginTop: 22, marginBottom: 12 }}>Truyện đề cử</h2>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 16,
                }}
            >
                {mockNovels.map((novel) => (
                    <div
                        key={novel.id}
                        onClick={handleNovelClick}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleNovelClick();
                        }}
                        style={{
                            borderRadius: 12,
                            border: '1px solid #333',
                            background: '#1b1b1b',
                            overflow: 'hidden',
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{ height: 180, background: '#111' }}>
                            <img
                                src={novel.coverUrl}
                                alt={novel.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                        </div>

                        <div style={{ padding: 12 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6, lineHeight: 1.2 }}>{novel.title}</div>
                            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>{novel.author}</div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                {novel.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        style={{
                                            fontSize: 12,
                                            padding: '4px 8px',
                                            borderRadius: 999,
                                            background: '#2a2a2a',
                                            border: '1px solid #3b3b3b',
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div style={{ fontSize: 12, opacity: 0.75 }}>
                                Lượt xem: {new Intl.NumberFormat('vi-VN').format(novel.views)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default HomePage;
