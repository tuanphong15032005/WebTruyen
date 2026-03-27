import React, { useEffect, useState } from 'react';
import { Gem, Banknote, CreditCard, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { getWallet } from '../../api/walletApi';
import '../../styles/author-withdrawal.css';

const PROCESSING_FEE_RATE = 0.05; // 5% phí xử lý, có thể đồng bộ với backend
const MIN_WITHDRAW_AMOUNT = 10001;
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

export default function WithdrawalRequestPage() {
  const [availableBalanceB, setAvailableBalanceB] = useState(0);
  const [amount, setAmount] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const fetchWithdrawHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:8081/api/withdrawals/my-requests', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      if (!res.ok) {
        const message = await res.text();
        console.error('Failed to fetch withdraw history:', message);
        setHistoryError(message || 'Không tải được lịch sử rút tiền.');
        return;
      }
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : []).map((item) => ({
        id: item.id,
        createdAt: item.requestedAt
          ? new Date(item.requestedAt).toLocaleString('vi-VN')
          : '',
        amountB: item.coinBAmount ?? 0,
        fee: item.feeCoinB ?? 0,
        netAmountB: item.netCoinB ?? 0,
        status: item.status ?? 'REQUESTED',
      }));
      setWithdrawRequests(mapped);
    } catch (err) {
      console.error('Error fetching withdraw history:', err);
      setHistoryError('Đã xảy ra lỗi khi tải lịch sử rút tiền.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await getWallet();
        const coinB =
          data?.coinB ??
          data?.balance_coin_b ??
          data?.coin_b ??
          data?.balanceCoinB ??
          0;
        setAvailableBalanceB(coinB);
      } catch (err) {
        console.error('Error fetching wallet for withdrawal:', err);
      }
    };

    fetchWallet();
    fetchWithdrawHistory();
  }, []);

  const parsedAmount = Number(amount) || 0;
  const isAmountValid =
    parsedAmount >= MIN_WITHDRAW_AMOUNT &&
    parsedAmount <= availableBalanceB &&
    Number.isFinite(parsedAmount);

  const fee = isAmountValid ? parsedAmount * PROCESSING_FEE_RATE : 0;
  const netAmount = isAmountValid ? parsedAmount - fee : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isAmountValid) {
      setError('Số tiền muốn rút phải lớn hơn 10000 và không vượt quá số dư có thể rút.');
      return;
    }
    if (!bankAccountNumber.trim() || !accountHolderName.trim() || !bankName.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng.');
      return;
    }
    if (!termsAccepted) {
      setError('Bạn cần đồng ý với điều khoản rút tiền trước khi gửi yêu cầu.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8081/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amountB: parsedAmount,
          bankAccountNumber,
          accountHolderName,
          bankName,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Gửi yêu cầu rút tiền thất bại.');
      }

      setSuccess('Yêu cầu rút tiền của bạn đã được gửi tới admin. Vui lòng chờ xét duyệt.');
      const created = await response.json().catch(() => null);

      setAvailableBalanceB((prev) => prev - parsedAmount);
      setAmount('');
      setBankAccountNumber('');
      setAccountHolderName('');
      setBankName('');
      setTermsAccepted(false);

      // Luôn reload toàn bộ lịch sử từ backend để chắc chắn bảng hiển thị đúng
      await fetchWithdrawHistory();
    } catch (err) {
      console.error('Withdrawal request error:', err);
      setError(err.message || 'Đã xảy ra lỗi, vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'REQUESTED':
        return 'Đã gửi yêu cầu';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'REJECTED':
        return 'Từ chối';
      case 'PAID':
        return 'Đã thanh toán';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return 'Chờ duyệt';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'REQUESTED':
        return 'withdrawal-status--pending';
      case 'APPROVED':
        return 'withdrawal-status--approved';
      case 'REJECTED':
        return 'withdrawal-status--rejected';
      case 'PAID':
        return 'withdrawal-status--paid';
      case 'CANCELLED':
        return 'withdrawal-status--rejected';
      default:
        return 'withdrawal-status--pending';
    }
  };

  return (
    <div className='author-withdrawal'>
      <div className='author-withdrawal__header'>
        <h1>Yêu cầu rút tiền</h1>
        <p>
          Gửi yêu cầu rút tiền hợp lệ đã tích lũy từ các nguồn được hệ thống ghi nhận.
          Số dư rút dựa trên <strong>(Kim cương)</strong>.
        </p>
      </div>

      <div className='author-withdrawal__grid'>
        <section className='author-withdrawal__card author-withdrawal__card--form'>
          <div className='author-withdrawal__balance'>
            <div className='author-withdrawal__balance-icon'>
              <Gem size={30} />
            </div>
            <div>
              <p className='author-withdrawal__balance-label'>Số dư có thể rút</p>
              <p className='author-withdrawal__balance-value'>
                {availableBalanceB.toLocaleString('vi-VN')} Kim cương 
              </p>
            </div>
          </div>

          <form className='author-withdrawal__form' onSubmit={handleSubmit}>
            <div className='author-withdrawal__field'>
              <label>
                <span>Số tiền muốn rút (Kim cương)</span>
                <small>Số Kim cương bạn muốn rút khỏi hệ thống</small>
              </label>
              <div className='author-withdrawal__input-wrapper'>
                <Gem size={18} />
                <input
                  type='number'
                  min={MIN_WITHDRAW_AMOUNT}
                  step='1'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder='Nhập số Kim cương ...'
                />
              </div>
              {!isAmountValid && amount && (
                <p className='author-withdrawal__field-error'>
                  Số tiền phải lớn hơn 10000 và không vượt quá số dư hiện tại.
                </p>
              )}
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
                  placeholder='Nhập số tài khoản nhận tiền'
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
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder='Nhập họ và tên chủ tài khoản'
                />
              </div>
            </div>

            <div className='author-withdrawal__field'>
              <label>
                <span>Tên ngân hàng</span>
              </label>
              <div className='author-withdrawal__input-wrapper'>
                <ShieldCheck size={18} />
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                >
                  <option value=''>Chọn ngân hàng nhận tiền</option>
                  {BANK_OPTIONS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='author-withdrawal__summary'>
              <div className='author-withdrawal__summary-row'>
                <span>Phí xử lý rút tiền (tạm tính)</span>
                <span>
                  {fee.toLocaleString('vi-VN', {
                    maximumFractionDigits: 0,
                  })}{' '}
                  Kim cương 
                </span>
              </div>
              <div className='author-withdrawal__summary-row author-withdrawal__summary-row--net'>
                <span>Số tiền thực nhận (VNĐ)</span>
                <span>
                  {netAmount.toLocaleString('vi-VN', {
                    maximumFractionDigits: 0,
                  })}{' '}
                  VNĐ 
                </span>
              </div>
            </div>

            <div className='author-withdrawal__terms'>
              <div className='author-withdrawal__terms-box'>
                <h3>Điều khoản và điều kiện rút tiền</h3>
                <ul>
                    <li>
                        - Hệ thống sẽ lấy <strong>5%</strong> trong tổng số tiền muốn rút để làm phí giao dịch
                    </li>
                  <li>
                    - Chỉ các khoản tiền <strong>hợp lệ</strong> từ các nguồn được hệ thống ghi nhận
                    mới được phép rút.
                  </li>
                  <li>
                    - Thời gian xử lý yêu cầu rút có thể từ <strong>1 - 5 ngày làm việc</strong>{' '}
                    tùy vào ngân hàng và khối lượng yêu cầu.
                  </li>
                  <li>
                    - Hệ thống có thể áp dụng thêm các quy định chống gian lận, kiểm tra thủ công
                    bởi admin trước khi thanh toán.
                  </li>
                  <li>
                    - Mọi sai sót do nhập sai thông tin tài khoản ngân hàng sẽ do <strong>người dùng</strong>{' '}
                    tự chịu trách nhiệm.
                  </li>
                </ul>
              </div>
              <label className='author-withdrawal__terms-check'>
                <input
                  type='checkbox'
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span>Tôi đã đọc và đồng ý với điều khoản rút tiền ở trên.</span>
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
              disabled={submitting || !isAmountValid || !termsAccepted}
            >
              {submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu rút tiền'}
            </button>
          </form>
        </section>

        <section className='author-withdrawal__card author-withdrawal__card--history'>
          <div className='author-withdrawal__history-head'>
            <h2>Trạng thái yêu cầu rút tiền</h2>
            <p>
              Theo dõi tiến độ các yêu cầu rút tiền: Chờ duyệt, Đã duyệt, Từ chối, Đã thanh toán.
            </p>
          </div>

          {historyLoading ? (
            <div className='author-withdrawal__history-empty'>
              <Clock size={22} />
              <p>Đang tải lịch sử rút tiền...</p>
            </div>
          ) : historyError ? (
            <div className='author-withdrawal__history-empty'>
              <AlertCircle size={22} />
              <p>{historyError}</p>
            </div>
          ) : withdrawRequests.length === 0 ? (
            <div className='author-withdrawal__history-empty'>
              <Clock size={22} />
              <p>Chưa có yêu cầu rút tiền nào.</p>
            </div>
          ) : (
            <div className='author-withdrawal__history-table'>
              <table>
                <thead>
                  <tr>
                    <th>Mã yêu cầu</th>
                    <th>Thời gian</th>
                    <th>Số rút </th>
                    <th>Phí </th>
                    <th>Thực nhận </th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawRequests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.id}</td>
                      <td>{req.createdAt}</td>
                      <td>{req.amountB.toLocaleString('vi-VN')}</td>
                      <td>{req.fee.toLocaleString('vi-VN')}</td>
                      <td>{req.netAmountB.toLocaleString('vi-VN')}</td>
                      <td>
                        <span className={`withdrawal-status ${getStatusClass(req.status)}`}>
                          {formatStatus(req.status)}
                        </span>
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

