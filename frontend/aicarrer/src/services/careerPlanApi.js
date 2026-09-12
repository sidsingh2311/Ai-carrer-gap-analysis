import api from './api';

export const careerPlanApi = {
  getPlan: async () => {
    const response = await api.get('/career-plan');
    return response.data;
  },

  generatePlan: async ({ targetRole, targetCompany, targetTimeline, weeklyCommitmentHours }) => {
    const response = await api.post('/career-plan/generate', {
      targetRole,
      targetCompany,
      targetTimeline,
      weeklyCommitmentHours,
    });
    return response.data;
  },

  toggleTask: async (milestoneId, taskId) => {
    const response = await api.patch('/career-plan/toggle-task', {
      milestoneId,
      taskId,
    });
    return response.data;
  },

  updateWeeklyFocus: async (weeklyFocus) => {
    const response = await api.patch('/career-plan/weekly-focus', {
      weeklyFocus,
    });
    return response.data;
  },
};

export default careerPlanApi;
