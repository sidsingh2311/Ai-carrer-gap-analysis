import api from './api';

export const startInterview = async (interviewData) => {
  const response = await api.post('/interview/start', interviewData);
  return response.data;
};

export const submitAnswer = async (answerData) => {
  const response = await api.post('/interview/answer', answerData);
  return response.data;
};
