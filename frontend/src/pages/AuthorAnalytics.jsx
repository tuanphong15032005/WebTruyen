import { useEffect, useMemo, useState } from 'react';
import '../styles/AuthorAnalytics.css';

const API_BASE = 'http://localhost:8081/api/author';

const getAuthHeaders = () => {
    const stored = localStorage.getItem('user');
    if (!stored) return {};
    try {
        const parsed = JSON.parse(stored);
        const token = parsed?.token || '';
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
        return {};
    }
};

const formatNumber = (value, fractionDigits = 0) => {
    if (value === null || value === undefined) return '0';
    const number = Number(value) || 0;
    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(number);
};

function MetricCard({ label, value }) {
    const displayValue = typeof value === 'string' ? value : formatNumber(value);
    return (
        <div className="analytics-metric-card">
            <div className="analytics-metric-label">{label}</div>
            <div className="analytics-metric-value">{displayValue}</div>
        </div>
    );
}

function BarChart({ title, data, tone = 'blue' }) {
    const maxValue = Math.max(1, ...(data || []).map((item) => Number(item?.value || 0)));

    return (
        <div className="analytics-chart-card">
            <h3>{title}</h3>
            {!data?.length ? (
                <div className="chart-empty">Không có dữ liệu</div>
            ) : (
                <div className="analytics-chart">
                    {data.map((item, index) => {
                        const value = Number(item?.value || 0);
                        const percent = Math.max(4, Math.round((value / maxValue) * 100));
                        return (
                            <div className="analytics-bar-col" key={`${item.label}-${index}`}>
                                <div className="analytics-bar-value">{formatNumber(value)}</div>
                                <div className={`analytics-bar-track ${tone}`}>
                                    <div className={`analytics-bar-fill ${tone}`} style={{ height: `${percent}%` }} />
                                </div>
                                <div className="analytics-bar-label">{item.label}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function AuthorAnalytics() {
    const [stories, setStories] = useState([]);
    const [selectedStoryId, setSelectedStoryId] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [loadingStories, setLoadingStories] = useState(true);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [error, setError] = useState('');

    const authHeaders = useMemo(() => getAuthHeaders(), []);

    const fetchStories = async () => {
        setLoadingStories(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/stories`, { headers: authHeaders });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Không thể tải danh sách truyện.');
            }
            const data = await response.json();
            const list = Array.isArray(data) ? data : [];
            setStories(list);
            if (!selectedStoryId && list.length > 0) {
                setSelectedStoryId(String(list[0].id));
            }
        } catch (err) {
            setError(err?.message || 'Lỗi tải danh sách truyện.');
        } finally {
            setLoadingStories(false);
        }
    };

    const fetchAnalytics = async (storyId) => {
        if (!storyId) {
            setAnalytics(null);
            return;
        }
        setLoadingAnalytics(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/analytics/stories/${storyId}`, { headers: authHeaders });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Không thể tải báo cáo thống kê.');
            }
            const data = await response.json();
            setAnalytics(data);
        } catch (err) {
            setError(err?.message || 'Lỗi tải thống kê.');
            setAnalytics(null);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    useEffect(() => {
        fetchStories();
    }, []);

    useEffect(() => {
        if (selectedStoryId) {
            fetchAnalytics(selectedStoryId);
        }
    }, [selectedStoryId]);

    return (
        <div className="author-analytics-page">
            <header className="author-analytics-header">
                <h1>Báo cáo hiệu suất tác phẩm</h1>
                <p>Theo dõi lượt xem, người theo dõi và doanh thu Coin của từng truyện.</p>
            </header>

            {error && <div className="analytics-message error">{error}</div>}

            <div className="analytics-filter">
                <label>Chọn truyện</label>
                <select
                    value={selectedStoryId}
                    onChange={(e) => setSelectedStoryId(e.target.value)}
                    disabled={loadingStories}
                >
                    <option value="">-- Chọn truyện --</option>
                    {stories.map((story) => (
                        <option key={story.id} value={story.id}>
                            {story.title}
                        </option>
                    ))}
                </select>
            </div>

            {loadingAnalytics && <div className="analytics-loading">Đang tải báo cáo...</div>}

            {!loadingAnalytics && analytics && (
                <>
                    <div className="analytics-story-title">{analytics.storyTitle || '—'}</div>

                    <div className="analytics-metrics-grid">
                        <MetricCard label="Tổng lượt xem" value={analytics.totalViews} />
                        <MetricCard label="Tổng Coin nhận được" value={analytics.totalCoinEarned} />
                        <MetricCard label="Tỷ lệ hiện hành (1 Coin)" value={`${formatNumber(analytics.currentCoinToCashRate, 6)} VND`} />
                        <MetricCard label="Doanh thu ước tính (VND)" value={formatNumber(analytics.estimatedCashRevenue, 2)} />
                        <MetricCard label="Tổng người theo dõi" value={analytics.totalFollowers} />
                    </div>

                    <div className="analytics-charts-grid">
                        <BarChart title="Lượt xem theo thời gian" data={analytics.viewsOverTime || []} tone="blue" />
                        <BarChart title="Doanh thu Coin theo thời gian" data={analytics.coinRevenueOverTime || []} tone="green" />
                        <BarChart title="Tăng trưởng theo dõi" data={analytics.followerGrowthOverTime || []} tone="purple" />
                    </div>

                    <div className="analytics-table-card">
                        <h3>Hiệu suất theo chương</h3>
                        <div className="analytics-table-wrap">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Chương</th>
                                        <th>Trạng thái</th>
                                        <th>Lượt xem</th>
                                        <th>Coin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(analytics.chapterPerformance || []).map((chapter, index) => (
                                        <tr key={chapter.chapterId || index}>
                                            <td>{chapter.chapterNumber || index + 1}</td>
                                            <td>{chapter.chapterTitle || '—'}</td>
                                            <td>{chapter.chapterStatus || '—'}</td>
                                            <td>{formatNumber(chapter.views)}</td>
                                            <td>{formatNumber(chapter.coinEarned)}</td>
                                        </tr>
                                    ))}
                                    {(analytics.chapterPerformance || []).length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="table-empty">Chưa có dữ liệu chương.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
