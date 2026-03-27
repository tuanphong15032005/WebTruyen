import api from './api';

const libraryAlbumService = {
  getAlbums: () => api.get('/library/albums'),
  getUserAlbums: (userId) => api.get(`/library/albums/user/${userId}`),
  getAlbumDetail: (albumId) => api.get(`/library/albums/${albumId}`),
  getPublicAlbumDetail: (albumId) => api.get(`/library/albums/${albumId}/public`),
  createAlbum: (payload) => api.post('/library/albums', payload),
  updateAlbumVisibility: (albumId, payload) =>
    api.put(`/library/albums/${albumId}/visibility`, payload),
};

export default libraryAlbumService;
