import client from './client';

export const settingsApi = {
  get: () => client.get('/settings'),
  update: (data) => client.post('/settings', data),
  getNextJob: () => client.get('/settings/next-job'),
};
