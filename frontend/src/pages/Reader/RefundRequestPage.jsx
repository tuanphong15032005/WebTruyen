import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CircleDollarSign,
  Clock,
  CreditCard,
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import refundService from '../../services/refundService';
import '../../styles/author-withdrawal.css';

const BANK_OPTIONS = [
  'ACB - Ngân hàng Á Châu',
  'Agribank - Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
  'Bac A Bank - Ngân hàng TMCP Bắc Á',
  'BaoViet Bank - Ngân hàng TMCP Bảo Việt',
  'BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
  'CBBank - Ngân hàng Xây dựng',
  'CIMB Bank Vietnam - Ngân hàng TNHH MTV CIMB Việt Nam',
  'Co-opBank - Ngân hàng Hợp tác xã Việt Nam',
  'DBS Bank Vietnam - Ngân hàng DBS Việt Nam',
  'DongA Bank - Ngân hàng TMCP Đông Á',
  'Eximbank - Ngân hàng TMCP Xuất Nhập khẩu Việt Nam',
  'GPBank - Ngân hàng Dầu khí Toàn cầu',
  'HDBank - Ngân hàng TMCP Phát triển TP.HCM',
  'Hong Leong Bank Vietnam - Ngân hàng Hong Leong Việt Nam',
  'HSBC Vietnam - Ngân hàng TNHH MTV HSBC Việt Nam',
  'IBK Bank Hanoi - Ngân hàng Công nghiệp Hàn Quốc',
  'Indovina Bank - Ngân hàng Indovina',
  'KBank Vietnam - Ngân hàng Kasikornbank Việt Nam',
  'KienlongBank - Ngân hàng TMCP Kiên Long',
  'LPBank - Ngân hàng TMCP Lộc Phát Việt Nam',
  'MB Bank - Ngân hàng TMCP Quân đội',
  'MSB - Ngân hàng TMCP Hàng Hải Việt Nam',
  'Nam A Bank - Ngân hàng TMCP Nam Á',
  'NCB - Ngân hàng TMCP Quốc Dân',
  'OCB - Ngân hàng TMCP Phương Đông',
  'OceanBank - Ngân hàng Đại Dương',
  'PGBank - Ngân hàng TMCP Thịnh vượng và Phát triển',
  'PVcomBank - Ngân hàng TMCP Đại Chúng Việt Nam',
  'Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín',
  'Saigonbank - Ngân hàng TMCP Sài Gòn Công thương',
  'SCB - Ngân hàng TMCP Sài Gòn',
  'SCB Vietnam - Standard Chartered Việt Nam',
  'SeABank - Ngân hàng TMCP Đông Nam Á',
  'SHB - Ngân hàng TMCP Sài Gòn - Hà Nội',
  'Shinhan Bank Vietnam - Ngân hàng Shinhan Việt Nam',
  'Techcombank - Ngân hàng TMCP Kỹ thương Việt Nam',
  'TPBank - Ngân hàng TMCP Tiên Phong',
  'UOB Vietnam - Ngân hàng UOB Việt Nam',
  'VIB - Ngân hàng TMCP Quốc tế Việt Nam',
  'VietABank - Ngân hàng TMCP Việt Á',
  'VietBank - Ngân hàng TMCP Việt Nam Thương Tín',
  'Vietcombank - Ngân hàng TMCP Ngoại thương Việt Nam',
  'VietinBank - Ngân hàng TMCP Công thương Việt Nam',
  'VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng',
  'Woori Bank Vietnam - Ngân hàng Woori Việt Nam',
];

function RefundRequestPage() {
  const [transactions, setTransactions] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedTransactionId, setSelectedTransactionId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const eligibleData = await refundService.getEligibleTransactions();
      const eligible = Array.isArray(eligibleData) ? eligibleData : [];
      setTransactions(eligible);
      if (!selectedTransactionId && eligible.length > 0) {
        setSelectedTransactionId(String(eligible[0].transactionId));
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách giao dịch có thể hoàn tiền.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const historyData = await refundService.getMyRefundRequests();
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      setHistoryError(err.message || 'Không thể tải lịch sử yêu cầu hoàn tiền.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadHistory();
  }, []);

  const selectedTransaction = useMemo(
    () =>
      transactions.find((item) => String(item.transactionId) === String(selectedTransactionId)) ||
      null,
    [transactions, selectedTransactionId],
  );

  const originalAmount = selectedTransaction?.originalAmount ?? 0;
  const maxRefundAmount = selectedTransaction?.maxRefundAmount ?? 0;
  const parsedRefundAmount = Number(refundAmount) || 0;
  const isValidRefundAmount =
    parsedRefundAmount > 0 &&
    parsedRefundAmount <= maxRefundAmount &&
    Number.isFinite(parsedRefundAmount);

  const statusLabel = (status) => {
    if (status === 'REQUESTED') return 'Đã gửi yêu cầu';
    if (status === 'APPROVED') return 'Đã duyệt';
    if (status === 'REJECTED') return 'Từ chối';
    if (status === 'PAID') return 'Đã hoàn tiền';
    if (status === 'CANCELLED') return 'Đã hủy';
    return 'Chờ duyệt';
  };

  const statusClass = (status) => {
    if (status === 'APPROVED') return 'withdrawal-status--approved';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'withdrawal-status--rejected';
    if (status === 'PAID') return 'withdrawal-status--paid';
    return 'withdrawal-status--pending';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedTransactionId) {
      setError('Vui lòng chọn giao dịch cần hoàn tiền.');
      return;
    }
    if (!isValidRefundAmount) {
      setError('Số tiền muốn hoàn không hợp lệ hoặc vượt quá giới hạn cho phép.');
      return;
    }
    if (!refundReason.trim()) {
      setError('Vui lòng nhập lý do hoàn tiền.');
      return;
    }
    if (!/^[\p{L}\s]+$/u.test(accountHolderName.trim())) {
      setError('Tên chủ tài khoản chỉ được nhập chữ và khoảng trắng.');
      return;
    }
    if (!bankAccountNumber.trim() || !accountHolderName.trim() || !bankName.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin ngân hàng nhận hoàn tiền.');
      return;
    }
    if (!agreedTerms) {
      setError('Bạn cần xác nhận điều khoản hoàn tiền trước khi gửi yêu cầu.');
      return;
    }

    setSubmitting(true);
    try {
      await refundService.createRefundRequest({
        transactionId: Number(selectedTransactionId),
        refundAmount: parsedRefundAmount,
        refundReason: refundReason.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
      });

      setSuccess('Yêu cầu hoàn tiền đã được gửi tới admin. Vui lòng chờ xét duyệt.');
      setRefundAmount('');
      setRefundReason('');
      setBankAccountNumber('');
      setAccountHolderName('');
      setBankName('');
      setAgreedTerms(false);

      await Promise.all([loadData(), loadHistory()]);
    } catch (err) {
      setError(err.message || 'Gửi yêu cầu hoàn tiền thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='author-withdrawal'>
      <div className='author-withdrawal__header'>
        <h1>Yêu cầu hoàn tiền</h1>
        <p>
          Gửi yêu cầu hoàn tiền cho giao dịch cụ thể khi có sự cố thanh toán. Reader không thể rút
          tiền tự do và bắt buộc phải chọn giao dịch liên quan.
        </p>
      </div>

      <div className='author-withdrawal__grid'>
        <section className='author-withdrawal__card author-withdrawal__card--form'>
          <div className='author-withdrawal__balance'>
            <div className='author-withdrawal__balance-icon'>
              <Undo2 size={30} />
            </div>
            <div>
              <p className='author-withdrawal__balance-label'>Giao dịch đã chọn</p>
              <p className='author-withdrawal__balance-value'>
                {selectedTransaction
                  ? `#${selectedTransaction.transactionId} - ${selectedTransaction.transactionType}`
                  : 'Chưa chọn giao dịch'}
              </p>
            </div>
          </div>

          <form className='author-withdrawal__form' onSubmit={handleSubmit}>
            <div className='author-withdrawal__field'>
              <label>
                <span>Chọn giao dịch cần hoàn tiền</span>
              </label>
              <div className='author-withdrawal__input-wrapper'>
                <CircleDollarSign size={18} />
                <select
                  value={selectedTransactionId}
                  onChange={(e) => setSelectedTransactionId(e.target.value)}
                >
                  <option value=''>-- Chọn giao dịch --</option>
                  {transactions.map((item) => (
                    <option key={item.transactionId} value={item.transactionId}>
                      #{item.transactionId} - {item.transactionType} -{' '}
                      {(item.originalAmount || 0).toLocaleString('vi-VN')} 
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='author-withdrawal__summary'>
              <div className='author-withdrawal__summary-row'>
                <span>Loại giao dịch</span>
                <span>{selectedTransaction?.transactionType || '—'}</span>
              </div>
              <div className='author-withdrawal__summary-row'>
                <span>Số tiền giao dịch gốc</span>
                <span>{originalAmount.toLocaleString('vi-VN')} Kim cương </span>
              </div>
              <div className='author-withdrawal__summary-row author-withdrawal__summary-row--net'>
                <span>Mức hoàn tối đa</span>
                <span>{maxRefundAmount.toLocaleString('vi-VN')} Kim cương </span>
              </div>
            </div>

            <div className='author-withdrawal__field'>
              <label>
                <span>Số tiền muốn hoàn (Kim cương )</span>
              </label>
              <div className='author-withdrawal__input-wrapper'>
                <Undo2 size={18} />
                <input
                  type='number'
                  min='1'
                  step='1'
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder='Nhập số tiền muốn hoàn...'
                />
              </div>
              {refundAmount && !isValidRefundAmount && (
                <p className='author-withdrawal__field-error'>
                  Số tiền phải lớn hơn 0 và không vượt quá mức hoàn tối đa.
                </p>
              )}
            </div>

            <div className='author-withdrawal__field'>
              <label>
                <span>Lý do hoàn tiền</span>
              </label>
              <textarea
                className='author-withdrawal__textarea'
                rows={4}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder='Mô tả sự cố: nạp lỗi, thanh toán lặp, mở khóa chương không thành công...'
              />
            </div>

            <div className='author-withdrawal__field'>
              <label>
                <span>Số tài khoản ngân hàng</span>
              </label>
              <div className='author-withdrawal__input-wrapper'>
                <CreditCard size={18} />
                <input
                  type='text'
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder='Nhập số tài khoản nhận hoàn tiền'
                />
              </div>
            </div>

            <div className='author-withdrawal__field'>
              <label>
                <span>Tên chủ tài khoản</span>
              </label>
              <div className='author-withdrawal__input-wrapper'>
                <Banknote size={18} />
                <input
                  type='text'
                  value={accountHolderName}
                  onChange={(e) => {
                    const onlyLettersAndSpaces = e.target.value.replace(
                      /[^\p{L}\s]/gu,
                      '',
                    );
                    setAccountHolderName(onlyLettersAndSpaces);
                  }}
                  placeholder='Nhập họ tên chủ tài khoản'
                />
              </div>
            </div>

            <div className='author-withdrawal__field'>
              <label>
                <span>Tên ngân hàng</span>
              </label>
              <div className='author-withdrawal__input-wrapper'>
                <ShieldCheck size={18} />
                <select value={bankName} onChange={(e) => setBankName(e.target.value)}>
                  <option value=''>Chọn ngân hàng nhận hoàn tiền</option>
                  {BANK_OPTIONS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='author-withdrawal__terms'>
              <div className='author-withdrawal__terms-box'>
                <h3>Điều khoản và điều kiện hoàn tiền</h3>
                <ul>
                  <li>Yêu cầu hoàn tiền bắt buộc gắn với một giao dịch cụ thể trong lịch sử.</li>
                  <li>
                    Admin sẽ kiểm tra đối soát trước khi quyết định duyệt, từ chối hoặc hoàn tiền.
                  </li>
                  <li>
                    Thông tin ngân hàng phải chính xác, nếu sai hệ thống không chịu trách nhiệm.
                  </li>
                </ul>
              </div>
              <label className='author-withdrawal__terms-check'>
                <input
                  type='checkbox'
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                />
                <span>Tôi xác nhận thông tin trên là chính xác và đồng ý điều khoản hoàn tiền.</span>
              </label>
            </div>

            {error && (
              <div className='author-withdrawal__alert author-withdrawal__alert--error'>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className='author-withdrawal__alert author-withdrawal__alert--success'>
                <ShieldCheck size={18} />
                <span>{success}</span>
              </div>
            )}

            <button
              type='submit'
              className='author-withdrawal__submit'
              disabled={submitting || loading || !selectedTransactionId || !agreedTerms}
            >
              {submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu hoàn tiền'}
            </button>
          </form>
        </section>

        <section className='author-withdrawal__card author-withdrawal__card--history'>
          <div className='author-withdrawal__history-head'>
            <h2>Lịch sử yêu cầu hoàn tiền</h2>
            <p>
              Theo dõi trạng thái xử lý: Chờ duyệt, Đã duyệt, Từ chối, Đã hoàn tiền hoặc Đã hủy.
            </p>
          </div>

          {historyLoading ? (
            <div className='author-withdrawal__history-empty'>
              <Clock size={22} />
              <p>Đang tải lịch sử hoàn tiền...</p>
            </div>
          ) : historyError ? (
            <div className='author-withdrawal__history-empty'>
              <AlertCircle size={22} />
              <p>{historyError}</p>
            </div>
          ) : history.length === 0 ? (
            <div className='author-withdrawal__history-empty'>
              <Clock size={22} />
              <p>Bạn chưa có yêu cầu hoàn tiền nào.</p>
            </div>
          ) : (
            <div className='author-withdrawal__history-table'>
              <table>
                <thead>
                  <tr>
                    <th>Mã YC</th>
                    <th>Giao dịch</th>
                    <th>Loại</th>
                    <th>Gốc (B)</th>
                    <th>Hoàn (B)</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>#{item.transactionId}</td>
                      <td>{item.transactionType || '—'}</td>
                      <td>{(item.originalAmount || 0).toLocaleString('vi-VN')}</td>
                      <td>{(item.refundAmount || 0).toLocaleString('vi-VN')}</td>
                      <td>
                        <span className={`withdrawal-status ${statusClass(item.status)}`}>
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td>
                        {item.requestedAt
                          ? new Date(item.requestedAt).toLocaleString('vi-VN')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default RefundRequestPage;

