import { useEffect, useMemo, useState } from 'react';
import useNotify from '../../hooks/useNotify';
import adminConversionRateService from '../../services/adminConversionRateService';
import '../../styles/admin-conversion-rate.css';

const defaultForm = {
  coinAmount: '',
  cashValue: '',
  effectiveDate: '',
};
const todayIso = new Date().toISOString().split('T')[0];

const formatMoney = (value) =>
  Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 });

function ConversionRateManagement() {
  const { notify } = useNotify();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const currentRateRecord = useMemo(() => history[0] || null, [history]);
  const previewRate = useMemo(() => {
    const coin = Number(form.coinAmount);
    const cash = Number(form.cashValue);
    if (!coin || coin <= 0 || !Number.isFinite(cash)) return 0;
    return cash / coin;
  }, [form.cashValue, form.coinAmount]);

  const isValidForm = useMemo(() => {
    const coin = Number(form.coinAmount);
    const cash = Number(form.cashValue);
    const hasValidDate = Boolean(form.effectiveDate) && form.effectiveDate >= todayIso;
    return coin > 0 && cash >= 0 && hasValidDate;
  }, [form.cashValue, form.coinAmount, form.effectiveDate]);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        setLoading(true);
        // Minhdq - 25/02/2026
        // [Fix admin-conversion-rate/id - V2 - branch: minhfinal2]
        const data = await adminConversionRateService.getHistory();
        if (!cancelled) {
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          notify(error.message || 'Không thể tải lịch sử tỷ giá', 'error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [notify]);

  // Minhdq - 25/02/2026
  // [Fix admin-conversion-rate/id - V2 - branch: minhfinal2]
  const handleSave = async () => {
    // Minhdq - 25/02/2026
    // [Fix conversion-rate-update-only/id - V2 - branch: minhfinal2]
    if (editingId) {
      notify('Bạn đang ở chế độ chỉnh sửa. Vui lòng bấm "Cập nhật" để sửa trực tiếp trên DB.', 'info');
      return;
    }
    if (!isValidForm) {
      notify('Vui lòng nhập đúng Coin, tiền mặt và chọn ngày hiệu lực từ hôm nay trở đi', 'info');
      return;
    }
    try {
      setSaving(true);
      const next = await adminConversionRateService.saveRate({
        coinAmount: Number(form.coinAmount),
        cashValue: Number(form.cashValue),
        effectiveDate: form.effectiveDate,
      });
      setHistory(next);
      setForm(defaultForm);
      notify('Đã lưu tỷ giá mới', 'success');
    } catch (error) {
      notify(error.message || 'Không thể lưu tỷ giá', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Minhdq - 25/02/2026
  // [Fix admin-conversion-rate/id - V2 - branch: minhfinal2]
  const handleUpdate = async () => {
    if (!editingId) {
      notify('Chọn một bản ghi để cập nhật', 'info');
      return;
    }
    if (!isValidForm) {
      notify('Vui lòng nhập đúng Coin, tiền mặt và chọn ngày hiệu lực từ hôm nay trở đi', 'info');
      return;
    }
    try {
      setSaving(true);
      const next = await adminConversionRateService.updateRate(editingId, {
        coinAmount: Number(form.coinAmount),
        cashValue: Number(form.cashValue),
        effectiveDate: form.effectiveDate,
      });
      setHistory(next);
      setEditingId(null);
      setForm(defaultForm);
      notify('Đã cập nhật tỷ giá', 'success');
    } catch (error) {
      notify(error.message || 'Không thể cập nhật tỷ giá', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(defaultForm);
  };

  const selectForEdit = (record) => {
    setEditingId(record.id);
    setForm({
      coinAmount: String(record.coinAmount),
      cashValue: String(record.cashValue),
      effectiveDate: record.effectiveDate || '',
    });
  };

  return (
    <section className='admin-rate'>
      <header className='admin-rate__header'>
        <h1>Quản lý tỷ giá Coin sang tiền mặt</h1>
        <p>Thiết lập tỷ giá minh bạch để đảm bảo chi trả doanh thu chính xác cho tác giả.</p>
      </header>

      <div className='admin-rate__current'>
        <span>Tỷ giá hiện tại</span>
        <strong>
          {currentRateRecord
            ? `1 Coin = ${formatMoney(currentRateRecord.rate)} VND`
            : 'Chưa có tỷ giá'}
        </strong>
      </div>

      <div className='admin-rate__form-grid'>
        <label>
          Số lượng Coin
          <input
            type='number'
            min='1'
            value={form.coinAmount}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, coinAmount: event.target.value }))
            }
            placeholder='Ví dụ: 1000'
          />
        </label>
        <label>
          Giá trị tiền mặt tương ứng (VND)
          <input
            type='number'
            min='0'
            value={form.cashValue}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, cashValue: event.target.value }))
            }
            placeholder='Ví dụ: 80000'
          />
        </label>
        <label>
          Ngày hiệu lực
          <input
            type='date'
            min={todayIso}
            value={form.effectiveDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, effectiveDate: event.target.value }))
            }
          />
        </label>
      </div>

      <div className='admin-rate__preview'>
        Tỷ giá sẽ áp dụng: <strong>{previewRate > 0 ? `1 Coin = ${formatMoney(previewRate)} VND` : '—'}</strong>
      </div>

      <div className='admin-rate__actions'>
        <button type='button' onClick={handleSave} disabled={saving || !isValidForm || Boolean(editingId)}>
          Lưu
        </button>
        <button
          type='button'
          className='update'
          onClick={handleUpdate}
          disabled={saving || !editingId || !isValidForm}
        >
          Cập nhật
        </button>
        <button type='button' className='cancel' onClick={handleCancel} disabled={saving}>
          Hủy
        </button>
      </div>

      <div className='admin-rate__history'>
        <h2>Lịch sử thay đổi tỷ giá</h2>
        {loading ? (
          <p className='admin-rate__empty'>Đang tải lịch sử...</p>
        ) : history.length === 0 ? (
          <p className='admin-rate__empty'>Chưa có lịch sử thay đổi tỷ giá.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Số lượng Coin</th>
                <th>Giá trị tiền mặt (VND)</th>
                <th>Tỷ giá quy đổi</th>
                <th>Ngày hiệu lực</th>
                <th>Cập nhật lúc</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.id} className={String(editingId) === String(record.id) ? 'active' : ''}>
                  <td>{formatMoney(record.coinAmount)}</td>
                  <td>{formatMoney(record.cashValue)}</td>
                  <td>{formatMoney(record.rate)} VND/Coin</td>
                  <td>{record.effectiveDate || '-'}</td>
                  <td>{record.updatedAt ? new Date(record.updatedAt).toLocaleString('vi-VN') : '-'}</td>
                  <td>
                    <button type='button' onClick={() => selectForEdit(record)}>
                      Chọn sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default ConversionRateManagement;
