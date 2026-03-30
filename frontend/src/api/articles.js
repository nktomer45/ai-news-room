import client from './client';

export const articleApi = {
  // Stats
  getStats: () => client.get('/articles/stats'),

  // Articles
  getAll: (params = {}) => client.get('/articles', { params }),
  getById: (id) => client.get(`/articles/${id}`),
  create: (data) => client.post('/articles', data),
  update: (id, data) => client.put(`/articles/${id}`, data),
  delete: (id) => client.delete(`/articles/${id}`),

  // Actions
  publish: (id) => client.patch(`/articles/${id}/publish`),
  draft: (id) => client.patch(`/articles/${id}/draft`),
  triggerTrendFetch: () => client.post('/articles/trigger-fetch'),
  getQueueStatus: () => client.get('/articles/queue-status'),
  getLiveTrends: () => client.get('/articles/live-trends'),
  triggerPipelineWithTopics: (topics) => client.post('/articles/trigger-pipeline-with-topics', { topics }),
  
  // Categories
  getCategories: () => client.get('/categories'),

  // Health
  checkHealth: () => client.get('/health'),
};

export const pipelineApi = {
  // Get all active runs
  getAllRuns: () => client.get('/pipeline/status'),
  // Get specific run
  getRun: (runId) => client.get(`/pipeline/status/${runId}`),
  // Cancel entire run
  cancelRun: (runId) => client.post(`/pipeline/cancel/${runId}`),
  // Cancel specific topic in a run
  cancelTopic: (runId, topicSlug) => client.post(`/pipeline/cancel/${runId}/topic/${topicSlug}`),
  // Toggle pause/resume
  pauseRun: (runId) => client.post(`/pipeline/pause/${runId}`),
  // SSE stream URL (used directly with EventSource)
  streamUrl: () => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return `${base}/pipeline/stream`;
  },
};
