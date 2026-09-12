import api from './api';

export const applicationApi = {
  getApplications: async () => {
    const response = await api.get('/applications');
    return response.data;
  },

  createApplication: async (data) => {
    const response = await api.post('/applications', data);
    return response.data;
  },

  updateApplication: async (id, data) => {
    const response = await api.put(`/applications/${id}`, data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/applications/${id}/status`, { status });
    return response.data;
  },

  deleteApplication: async (id) => {
    const response = await api.delete(`/applications/${id}`);
    return response.data;
  },

  matchJobDescription: async (formData) => {
    const response = await api.post('/analysis/match-jd', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default applicationApi;
