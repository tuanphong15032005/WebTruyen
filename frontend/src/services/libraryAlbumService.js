import api from './api';

const libraryAlbumService = {
  getAlbums: () => api.get('/library/albums'),
  getAlbumDetail: (albumId) => api.get(`/library/albums/${albumId}`),
  createAlbum: (payload) => api.post('/library/albums', payload),
};

export default libraryAlbumService;
