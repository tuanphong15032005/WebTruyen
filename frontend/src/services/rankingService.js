import api from './api';

const rankingService = {
  /** Xếp hạng tác giả theo lượt theo dõi */
  getAuthorRanking: (params = {}) => {
    const limit = params.limit ?? 50;
    return api.get('/public/ranking/authors', { params: { limit } });
  },

  /** Top truyện theo lượt theo dõi (lưu thư viện) */
  getTopStoriesByFollows: (params = {}) => {
    const limit = params.limit ?? 50;
    return api.get('/public/ranking/stories/by-follows', { params: { limit } });
  },
};

export default rankingService;
