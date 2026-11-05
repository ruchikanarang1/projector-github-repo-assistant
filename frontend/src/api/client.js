import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 90000, // 90 seconds for large repo analysis / LLM synthesis
});

// Response interceptor to cache key data in localStorage for offline PWA
api.interceptors.response.use(
  (response) => {
    // If successfully fetched, save in offline cache
    const url = response.config.url;
    if (url && (url.includes('/api/projects') || url.includes('/api/docs') || url.includes('/api/interview'))) {
      try {
        localStorage.setItem(`offline_cache_${url}`, JSON.stringify(response.data));
      } catch (e) {
        console.warn('Storage quota exceeded for offline cache');
      }
    }
    return response;
  },
  (error) => {
    // If offline or network error, attempt to retrieve from cache
    if (!navigator.onLine && error.config && error.config.url) {
      const cached = localStorage.getItem(`offline_cache_${error.config.url}`);
      if (cached) {
        return Promise.resolve({ data: JSON.parse(cached), status: 200, fromCache: true });
      }
    }
    return Promise.reject(error);
  }
);

export const projectApi = {
  list: () => api.get('/api/projects').then((res) => res.data),
  get: (id) => api.get(`/api/projects/${id}`).then((res) => res.data),
  importGitHub: (data) => api.post('/api/projects/github', data).then((res) => res.data),
  uploadZip: (formData) => api.post('/api/projects/upload-zip', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data),
  importLocal: (data) => api.post('/api/projects/local', data).then((res) => res.data),
  createSample: () => api.post('/api/projects/sample').then((res) => res.data),
  getFile: (projectId, path) => api.get(`/api/projects/${projectId}/file`, { params: { path } }).then((res) => res.data),
  delete: (projectId) => api.delete(`/api/projects/${projectId}`).then((res) => res.data),
  getGitHubProfile: (token) => api.get('/api/projects/github/profile', { params: { token } }).then((res) => res.data),
  getGitHubUserRepos: (token) => api.get('/api/projects/github/user-repos', { params: { token } }).then((res) => res.data),
};

export const chatApi = {
  createSession: (data) => api.post('/api/chat/sessions', data).then((res) => res.data),
  listSessions: (projectId) => api.get(`/api/chat/sessions/${projectId}`).then((res) => res.data),
  getMessages: (sessionId) => api.get(`/api/chat/sessions/${sessionId}/messages`).then((res) => res.data),
  sendMessage: (sessionId, data) => api.post(`/api/chat/sessions/${sessionId}/messages`, data).then((res) => res.data),
};

export const docApi = {
  list: (projectId) => api.get(`/api/docs/${projectId}`).then((res) => res.data),
  generate: (projectId, data) => api.post(`/api/docs/${projectId}/generate`, data).then((res) => res.data),
  exportZipUrl: (projectId) => `${API_BASE}/api/docs/${projectId}/export/zip`,
};

export const interviewApi = {
  getFlashcards: (projectId) => api.get(`/api/interview/${projectId}/flashcards`).then((res) => res.data),
  updateFlashcard: (flashcardId, data) => api.put(`/api/interview/flashcards/${flashcardId}`, data).then((res) => res.data),
  generateCards: (projectId) => api.post(`/api/interview/${projectId}/generate-cards`).then((res) => res.data),
  evaluate: (data) => api.post('/api/interview/evaluate', data).then((res) => res.data),
};

export const settingsApi = {
  get: () => api.get('/api/settings').then((res) => res.data),
  update: (data) => api.post('/api/settings', data).then((res) => res.data),
};

export default api;

