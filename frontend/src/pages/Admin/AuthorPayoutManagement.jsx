import { useEffect, useMemo, useState } from 'react';
import useNotify from '../../hooks/useNotify';
import adminConversionRateService from '../../services/adminConversionRateService';
import adminPayoutService from '../../services/adminPayoutService';
import '../../styles/admin-author-payout.css';

const formatNumber = (value) =>
  Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 });

function AuthorPayoutManagement() {
  const { notify } = useNotify();
  const [eligibleAuthors, setEligibleAuthors] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [coinToCashRate, setCoinToCashRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyAuthorId, setBusyAuthorId] = useState(null);

  const eligibleGrid = useMemo(
    () =>
      eligibleAuthors.map((author) => ({
        ...author,
        convertedCashAmount: Number(author.availableCoin || 0) * Number(coinToCashRate || 0),
      })),
    [coinToCashRate, eligibleAuthors]
  );

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        // Minhdq - 25/02/2026
        // [Fix admin-author-payout/id - V2 - branch: minhfinal2]
        const [authors, history, conversionHistory] = await Promise.all([
          adminPayoutService.getEligibleAuthors(),
          adminPayoutService.getPayoutHistory(),
          adminConversionRateService.getHistory(),
        ]);
        if (!cancelled) {
          setEligibleAuthors(Array.isArray(authors) ? authors : []);
          setPayoutHistory(Array.isArray(history) ? history : []);
          setCoinToCashRate(
            conversionHistory?.[0]?.rate && Number(conversionHistory[0].rate) > 0
              ? Number(conversionHistory[0].rate)
              : 1
          );
        }
      } catch (error) {
        if (!cancelled) {
          notify(error.message || 'Không thể tải dữ liệu chi trả doanh thu', 'error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [notify]);

  // Minhdq - 25/02/2026
  // [Fix admin-author-payout/id - V2 - branch: minhfinal2]
  const handleConfirmPayout = async (author) => {
    try {
      setBusyAuthorId(author.id);
      const cashAmount = Number(author.availableCoin || 0) * Number(coinToCashRate || 0);
      const result = await adminPayoutService.confirmPayout({
        requestId: author.id,
        coinAmount: Number(author.availableCoin || 0),
        cashAmount,
      });
      setEligibleAuthors(result.eligibleAuthors || []);
      setPayoutHistory(result.payoutHistory || []);
      notify('Đã xác nhận chi trả doanh thu cho tác giả', 'success');
    } catch (error) {
      notify(error.message || 'Không thể xác nhận chi trả', 'error');
    } finally {
      setBusyAuthorId(null);
    }
  };

  return (
    <section className='admin-payout'>
      <header className='admin-payout__header'>
        <h1>Quản lý chi trả doanh thu tác giả</h1>
        <p>Quản lý chi trả doanh thu theo số Coin tích lũy, theo dõi trạng thái và lịch sử thanh toán.</p>
      </header>

      <div className='admin-payout__rate'>
        Tỷ giá áp dụng hiện tại: <strong>1 Coin = {formatNumber(coinToCashRate)} VND</strong>
      </div>

      <section className='admin-payout__section'>
        <h2>Danh sách tác giả đủ điều kiện rút tiền</h2>
        {loading ? (
          <p className='admin-payout__empty'>Đang tải danh sách tác giả...</p>
        ) : eligibleGrid.length === 0 ? (
          <p className='admin-payout__empty'>Không có tác giả đủ điều kiện chi trả.</p>
        ) : (
          <div className='admin-payout__grid'>
            {eligibleGrid.map((author) => (
              <article key={author.id} className='admin-payout__card'>
                <h3>{author.authorName}</h3>
                <p>
                  Coin khả dụng: <strong>{formatNumber(author.availableCoin)} Coin</strong>
                </p>
                <p>
                  Số tiền quy đổi: <strong>{formatNumber(author.convertedCashAmount)} VND</strong>
                </p>
                <p>
                  Trạng thái thanh toán: <span>{author.paymentStatus}</span>
                </p>
                <button
                  type='button'
                  onClick={() => handleConfirmPayout(author)}
                  disabled={busyAuthorId === author.id}
                >
                  {busyAuthorId === author.id ? 'Đang xử lý...' : 'Xác nhận chi trả'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className='admin-payout__section admin-payout__history'>
        <h2>Lịch sử chi trả doanh thu</h2>
        {loading ? (
          <p className='admin-payout__empty'>Đang tải lịch sử chi trả...</p>
        ) : payoutHistory.length === 0 ? (
          <p className='admin-payout__empty'>Chưa có lịch sử chi trả.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tác giả</th>
                <th>Coin đã chi trả</th>
                <th>Số tiền đã chi trả</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map((record) => (
                <tr key={record.id}>
                  <td>{record.authorName}</td>
                  <td>{formatNumber(record.coinAmount)} Coin</td>
                  <td>{formatNumber(record.cashAmount)} VND</td>
                  <td>{record.status}</td>
                  <td>{record.paidAt ? new Date(record.paidAt).toLocaleString('vi-VN') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}

export default AuthorPayoutManagement;
