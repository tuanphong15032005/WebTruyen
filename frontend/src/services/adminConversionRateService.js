import api from './api';

const STORAGE_KEY = 'admin_conversion_rate_history_v2';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeRecord = (record) => {
  const coinAmount = toNumber(record?.coinAmount);
  const cashValue = toNumber(record?.cashValue);
  const rate = coinAmount > 0 ? cashValue / coinAmount : 0;
  return {
    id: record?.id || Date.now(),
    coinAmount,
    cashValue,
    rate,
    effectiveDate: record?.effectiveDate || '',
    updatedAt: record?.updatedAt || new Date().toISOString(),
  };
};

const sortHistory = (items) =>
  [...items].sort((a, b) => {
    const dateA = new Date(a.effectiveDate || a.updatedAt || 0).getTime();
    const dateB = new Date(b.effectiveDate || b.updatedAt || 0).getTime();
    return dateB - dateA;
  });

const readLocalHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return sortHistory(parsed.map(normalizeRecord));
  } catch {
    return [];
  }
};

const writeLocalHistory = (items) => {
  const normalized = sortHistory(items.map(normalizeRecord));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

const adminConversionRateService = {
  // Minhdq - 25/02/2026
  // [Fix admin-conversion-rate/id - V2 - branch: minhfinal2]
  getHistory: async () => {
    try {
      const data = await api.get('/admin/conversion-rates');
      if (Array.isArray(data)) {
        const normalized = sortHistory(data.map(normalizeRecord));
        writeLocalHistory(normalized);
        return normalized;
      }
      return [];
    } catch (error) {
      throw error;
    }
  },

  // Minhdq - 25/02/2026
  // [Fix admin-conversion-rate/id - V2 - branch: minhfinal2]
  saveRate: async (payload) => {
    const newRecord = normalizeRecord({
      ...payload,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      updatedAt: new Date().toISOString(),
    });

    const created = await api.post('/admin/conversion-rates', {
      coinAmount: newRecord.coinAmount,
      cashValue: newRecord.cashValue,
      effectiveDate: newRecord.effectiveDate,
    });
    const local = readLocalHistory();
    const saved = normalizeRecord(created || newRecord);
    return writeLocalHistory([saved, ...local]);
  },

  // Minhdq - 25/02/2026
  // [Fix admin-conversion-rate/id - V2 - branch: minhfinal2]
  updateRate: async (id, payload) => {
    const next = normalizeRecord({
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    });
    const updated = await api.put(`/admin/conversion-rates/${id}`, {
      coinAmount: next.coinAmount,
      cashValue: next.cashValue,
      effectiveDate: next.effectiveDate,
    });
    const saved = normalizeRecord(updated || next);
    const refreshed = await api.get('/admin/conversion-rates');
    if (Array.isArray(refreshed)) {
      const normalized = sortHistory(refreshed.map(normalizeRecord));
      return writeLocalHistory(normalized);
    }
    const local = readLocalHistory();
    return writeLocalHistory(local.map((item) => (String(item.id) === String(id) ? saved : item)));
  },
};

export default adminConversionRateService;
