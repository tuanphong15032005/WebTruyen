import api from './api';

// Minhdq - 26/02/2026
// [Add author-public-profile-follow-service-api - V1 - branch: clone-minhfinal2]
const authorService = {
  getPublicAuthorProfile: (authorId) =>
    api.get(`/public/authors/${authorId}/profile`),

  toggleFollowAuthor: (authorId) =>
    api.post(`/authors/${authorId}/follow/toggle`),
};

export default authorService;
