import TessMemory from "../models/tessMemory.model.js";
import TessConversation from "../models/tessConversation.model.js";
import {
  chatWithTessService,
  generateProactiveSuggestions,
  syncHistoricalUserData,
  createMemory,
} from "../services/tess.service.js";

/**
 * Send a chat message to Tess (RAG-powered)
 */
export const chatWithTess = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { message, conversationId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    // Find or create active conversation
    let conversation;
    if (conversationId) {
      conversation = await TessConversation.findOne({ _id: conversationId, user: userId });
    }

    if (!conversation) {
      // Find latest non-archived or create new
      conversation = await TessConversation.findOne({ user: userId, isArchived: false }).sort({ updatedAt: -1 });
      if (!conversation) {
        conversation = await TessConversation.create({
          user: userId,
          title: message.slice(0, 32) + (message.length > 32 ? "..." : ""),
          messages: [],
        });
      }
    }

    // Build recent history for context
    const history = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Invoke RAG chat service
    const response = await chatWithTessService({
      userId,
      userMessage: message,
      conversationHistory: history,
    });

    // Save user message and assistant reply to conversation
    conversation.messages.push({
      role: "user",
      content: message,
    });

    conversation.messages.push({
      role: "assistant",
      content: response.reply,
      retrievedMemories: response.retrievedMemories,
      suggestions: response.suggestions,
    });

    await conversation.save();

    return res.status(200).json({
      success: true,
      data: {
        conversationId: conversation._id,
        reply: response.reply,
        retrievedMemories: response.retrievedMemories,
        suggestions: response.suggestions,
      },
    });
  } catch (error) {
    console.error("Tess Chat Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Tess encountered an error processing your request",
      error: error.message,
    });
  }
};

/**
 * Get proactive suggestions for the user
 */
export const getSuggestions = async (req, res) => {
  try {
    const userId = req.user?._id;
    const suggestions = await generateProactiveSuggestions(userId);

    return res.status(200).json({
      success: true,
      data: {
        suggestions,
      },
    });
  } catch (error) {
    console.error("Tess Suggestions Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load personalized suggestions",
      data: { suggestions: [] },
    });
  }
};

/**
 * Get all memories stored in Tess's vault for this user
 */
export const getMemoryVault = async (req, res) => {
  try {
    const userId = req.user?._id;
    const memories = await TessMemory.find({ user: userId }).sort({ createdAt: -1 }).lean();

    // Grouping by category
    const stats = {
      total: memories.length,
      resumeGaps: memories.filter((m) => m.category === "skill_gap" || m.category === "resume_profile").length,
      quizzes: memories.filter((m) => m.category === "quiz_performance").length,
      interviews: memories.filter((m) => m.category === "interview_feedback").length,
      goalsAndNotes: memories.filter(
        (m) => m.category === "career_goal" || m.category === "user_preference" || m.category === "conversation_note"
      ).length,
    };

    return res.status(200).json({
      success: true,
      data: {
        memories,
        stats,
      },
    });
  } catch (error) {
    console.error("Tess Memory Vault Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch memory vault",
      data: { memories: [], stats: {} },
    });
  }
};

/**
 * Manually add a memory / note to Tess
 */
export const addMemory = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { title, content, category, tags, importance } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const memory = await createMemory({
      userId,
      title,
      content,
      category: category || "user_preference",
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : [],
      importance: Number(importance) || 7,
      source: "manual",
    });

    return res.status(201).json({
      success: true,
      message: "Memory successfully stored in Tess's vault",
      data: memory,
    });
  } catch (error) {
    console.error("Tess Add Memory Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add memory",
    });
  }
};

/**
 * Delete a memory from Tess's vault
 */
export const deleteMemory = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { memoryId } = req.params;

    const deleted = await TessMemory.findOneAndDelete({ _id: memoryId, user: userId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Memory not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Memory deleted successfully",
    });
  } catch (error) {
    console.error("Tess Delete Memory Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete memory",
    });
  }
};

/**
 * Trigger historical data sync
 */
export const syncHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    const result = await syncHistoricalUserData(userId);

    return res.status(200).json({
      success: true,
      message: `Historical sync complete. ${result.synced} memories indexed.`,
      data: result,
    });
  } catch (error) {
    console.error("Tess Sync Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to sync historical activity",
    });
  }
};

/**
 * Get active conversation or conversation list
 */
export const getActiveConversation = async (req, res) => {
  try {
    const userId = req.user?._id;
    let conversation = await TessConversation.findOne({ user: userId, isArchived: false }).sort({ updatedAt: -1 });

    if (!conversation) {
      conversation = await TessConversation.create({
        user: userId,
        title: "Session with Tess",
        messages: [
          {
            role: "assistant",
            content:
              "Hello! I am **Tess**, your personal AI Career Copilot. I'm connected to your resume scans, quiz assessments, and interview practice to help you close your skill gaps. What would you like to achieve today?",
            suggestions: [
              {
                title: "Analyze My Progress",
                description: "Review your skills and scores",
                actionType: "chat",
                actionPayload: { prompt: "Analyze my overall career progress and top gaps." },
              },
              {
                title: "Recommended Daily Plan",
                description: "Get today's prioritized study plan",
                actionType: "chat",
                actionPayload: { prompt: "What should I focus on learning today?" },
              },
            ],
          },
        ],
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Tess Get Active Conversation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load conversation",
    });
  }
};

/**
 * Clear or reset current conversation
 */
export const clearConversation = async (req, res) => {
  try {
    const userId = req.user?._id;
    await TessConversation.updateMany({ user: userId }, { isArchived: true });

    return res.status(200).json({
      success: true,
      message: "Conversation reset successfully",
    });
  } catch (error) {
    console.error("Tess Clear Conversation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset conversation",
    });
  }
};
