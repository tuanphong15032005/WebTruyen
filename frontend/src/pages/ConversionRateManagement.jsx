import { useEffect, useMemo, useState } from 'react';
import '../styles/ConversionRateManagement.css';

const API_BASE = 'http://localhost:8081/api/admin/conversion-rates';

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

const formatDate = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString('vi-VN');
    } catch {
        return value;
    }
};

const formatDateTime = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('vi-VN');
    } catch {
        return value;
    }
};

const formatNumber = (value, fractionDigits = 0) => {
    const number = Number(value ?? 0);
    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(Number.isFinite(number) ? number : 0);
};

export default function ConversionRateManagement() {
    const [history, setHistory] = useState([]);
    const [currentRate, setCurrentRate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        coinAmount: '',
        cashAmount: '',
        effectiveDate: '',
    });

    const authHeaders = useMemo(() => getAuthHeaders(), []);

    const fetchManagementData = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await fetch(`${API_BASE}/management`, { headers: authHeaders });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Không thể tải dữ liệu tỷ lệ quy đổi.');
            }
            const data = await response.json();
            setCurrentRate(data?.currentRate || null);
            setHistory(Array.isArray(data?.history) ? data.history : []);
        } catch (err) {
            setError(err?.message || 'Lỗi tải dữ liệu tỷ lệ quy đổi.');
            setCurrentRate(null);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManagementData();
    }, []);

    const resetForm = (clearNotice = true) => {
        setEditingId(null);
        setForm({ coinAmount: '', cashAmount: '', effectiveDate: '' });
        setError('');
        if (clearNotice) {
            setMessage('');
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setForm({
            coinAmount: String(item.coinAmount ?? ''),
            cashAmount: String(item.cashAmount ?? ''),
            effectiveDate: item.effectiveDate || '',
        });
        setError('');
        setMessage(`Đang chỉnh sửa tỷ lệ #${item.id}.`);
    };

    const submitForm = async (mode) => {
        setError('');
        setMessage('');

        const coinAmount = Number(form.coinAmount);
        const cashAmount = Number(form.cashAmount);
        if (!Number.isFinite(coinAmount) || coinAmount <= 0) {
            setError('Coin amount phải lớn hơn 0.');
            return;
        }
        if (!Number.isFinite(cashAmount) || cashAmount <= 0) {
            setError('Cash amount phải lớn hơn 0.');
            return;
        }
        if (!form.effectiveDate) {
            setError('Vui lòng chọn ngày hiệu lực.');
            return;
        }

        setSubmitting(true);
        try {
            const method = mode === 'update' ? 'PUT' : 'POST';
            const url = mode === 'update' ? `${API_BASE}/${editingId}` : API_BASE;
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                    coinAmount,
                    cashAmount,
                    effectiveDate: form.effectiveDate,
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Không thể lưu tỷ lệ quy đổi.');
            }

            await fetchManagementData();
            if (mode === 'update') {
                setMessage('Đã cập nhật tỷ lệ quy đổi.');
            } else {
                setMessage('Đã lưu tỷ lệ quy đổi mới.');
            }
            resetForm(false);
        } catch (err) {
            setError(err?.message || 'Lỗi khi lưu tỷ lệ quy đổi.');
        } finally {
            setSubmitting(false);
        }
    };

    const derivedRate = useMemo(() => {
        const coin = Number(form.coinAmount);
        const cash = Number(form.cashAmount);
        if (!Number.isFinite(coin) || coin <= 0 || !Number.isFinite(cash) || cash <= 0) return null;
        return cash / coin;
    }, [form.coinAmount, form.cashAmount]);

    return (
        <div className="conversion-page">
            <header className="conversion-header">
                <div>
                    <h1>Quản lý tỷ lệ quy đổi Coin</h1>
                    <p>Cập nhật minh bạch tỷ lệ Coin sang tiền để đảm bảo payout chính xác cho tác giả.</p>
                </div>
                <button className="refresh-button" onClick={fetchManagementData} disabled={loading || submitting}>
                    {loading ? 'Đang tải...' : 'Tải lại'}
                </button>
            </header>

            {message && <div className="conversion-message success">{message}</div>}
            {error && <div className="conversion-message error">{error}</div>}

            <section className="conversion-current-rate-card">
                <div className="field-label">Current conversion rate</div>
                <div className="field-value">
                    {currentRate
                        ? `1 Coin = ${formatNumber(currentRate.conversionRate, 6)} VND`
                        : 'Chưa có tỷ lệ quy đổi hiện hành'}
                </div>
                {currentRate && (
                    <div className="field-subtext">
                        Hiệu lực từ {formatDate(currentRate.effectiveDate)} • Cập nhật: {formatDateTime(currentRate.updatedAt)}
                    </div>
                )}
            </section>

            <section className="conversion-form-card">
                <h3>{editingId ? `Cập nhật tỷ lệ #${editingId}` : 'Thêm tỷ lệ mới'}</h3>
                <div className="conversion-form-grid">
                    <label>
                        Coin amount
                        <input
                            type="number"
                            min="1"
                            value={form.coinAmount}
                            onChange={(e) => setForm((prev) => ({ ...prev, coinAmount: e.target.value }))}
                            placeholder="Ví dụ: 1000"
                        />
                    </label>
                    <label>
                        Corresponding cash value
                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={form.cashAmount}
                            onChange={(e) => setForm((prev) => ({ ...prev, cashAmount: e.target.value }))}
                            placeholder="Ví dụ: 25000"
                        />
                    </label>
                    <label>
                        Effective date
                        <input
                            type="date"
                            value={form.effectiveDate}
                            onChange={(e) => setForm((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                        />
                    </label>
                    <label>
                        Conversion preview
                        <input
                            type="text"
                            readOnly
                            value={derivedRate === null ? '—' : `1 Coin = ${formatNumber(derivedRate, 6)} VND`}
                        />
                    </label>
                </div>

                <div className="conversion-action-group">
                    <button
                        className="action-button save"
                        disabled={submitting || !!editingId}
                        onClick={() => submitForm('create')}
                    >
                        Save
                    </button>
                    <button
                        className="action-button update"
                        disabled={submitting || !editingId}
                        onClick={() => submitForm('update')}
                    >
                        Update
                    </button>
                    <button
                        className="action-button cancel"
                        disabled={submitting}
                        onClick={resetForm}
                    >
                        Cancel
                    </button>
                </div>
            </section>

            <section className="conversion-history-card">
                <h3>Conversion rate change history</h3>
                <div className="history-table-wrap">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Coin amount</th>
                                <th>Cash value</th>
                                <th>Rate (1 Coin)</th>
                                <th>Effective date</th>
                                <th>Updated at</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="table-empty">Đang tải dữ liệu...</td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="table-empty">Chưa có lịch sử thay đổi tỷ lệ.</td>
                                </tr>
                            ) : (
                                history.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>{index + 1}</td>
                                        <td>{formatNumber(item.coinAmount)}</td>
                                        <td>{formatNumber(item.cashAmount, 2)}</td>
                                        <td>{formatNumber(item.conversionRate, 6)}</td>
                                        <td>{formatDate(item.effectiveDate)}</td>
                                        <td>{formatDateTime(item.updatedAt)}</td>
                                        <td>
                                            <button className="table-edit-button" onClick={() => handleEdit(item)}>
                                                Chỉnh sửa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
