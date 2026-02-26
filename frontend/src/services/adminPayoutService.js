import api from './api';

const normalizeEligibleAuthor = (author) => ({
  id: author?.requestId || '',
  authorId: author?.authorId || '',
  authorName: author?.authorName || author?.penName || author?.username || 'Tác giả',
  availableCoin: Number(author?.availableCoin || author?.coinBalance || 0),
  paymentStatus: author?.paymentStatus || 'Sẵn sàng chi trả',
});

const normalizePayoutHistoryRecord = (record) => ({
  id: record?.requestId || record?.id || '',
  authorId: record?.authorId || '',
  authorName: record?.authorName || record?.penName || 'Tác giả',
  coinAmount: Number(record?.coinAmount || 0),
  cashAmount: Number(record?.cashAmount || 0),
  status: record?.status || 'Đã chi trả',
  paidAt: record?.paidAt || record?.updatedAt || new Date().toISOString(),
});

const adminPayoutService = {
  // Minhdq - 25/02/2026
  // [Fix admin-author-payout/id - V2 - branch: minhfinal2]
  getEligibleAuthors: async () => {
    const data = await api.get('/admin/payouts/eligible-authors');
    return Array.isArray(data) ? data.map(normalizeEligibleAuthor) : [];
  },

  // Minhdq - 25/02/2026
  // [Fix admin-author-payout/id - V2 - branch: minhfinal2]
  getPayoutHistory: async () => {
    const data = await api.get('/admin/payouts/history');
    return Array.isArray(data) ? data.map(normalizePayoutHistoryRecord) : [];
  },

  // Minhdq - 25/02/2026
  // [Fix admin-author-payout/id - V2 - branch: minhfinal2]
  confirmPayout: async ({ requestId, coinAmount, cashAmount }) => {
    await api.post(`/admin/payouts/${requestId}/confirm`, {
      coinAmount,
      cashAmount,
    });

    const [nextEligible, nextHistory] = await Promise.all([
      adminPayoutService.getEligibleAuthors(),
      adminPayoutService.getPayoutHistory(),
    ]);

    return {
      eligibleAuthors: nextEligible,
      payoutHistory: nextHistory,
    };
  },
};

export default adminPayoutService;
