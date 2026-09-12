import api from './api';

export const tessApi = {
  // Send a chat message to Tess (RAG-powered)
  chat: async (message, conversationId = null) => {
    const response = await api.post('/tess/chat', { message, conversationId });
    return response.data;
  },

  // Get proactive recommendations for today
  getSuggestions: async () => {
    const response = await api.get('/tess/suggestions');
    return response.data;
  },

  // Get all memories currently stored in Tess's vault
  getMemories: async () => {
    const response = await api.get('/tess/memories');
    return response.data;
  },

  // Add a manual memory/preference/fact
  addMemory: async ({ title, content, category, tags, importance }) => {
    const response = await api.post('/tess/memories', {
      title,
      content,
      category,
      tags,
      importance,
    });
    return response.data;
  },

  // Delete a specific memory item
  deleteMemory: async (memoryId) => {
    const response = await api.delete(`/tess/memories/${memoryId}`);
    return response.data;
  },

  // Synchronize past user history (quizzes, interviews) into Tess
  syncHistory: async () => {
    const response = await api.post('/tess/sync');
    return response.data;
  },

  // Get active conversation session
  getConversation: async () => {
    const response = await api.get('/tess/conversation');
    return response.data;
  },

  // Reset/clear conversation history
  resetConversation: async () => {
    const response = await api.post('/tess/conversation/reset');
    return response.data;
  },
};

export default tessApi;
