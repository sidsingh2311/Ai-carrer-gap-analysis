import mongoose from "mongoose";

const tessMemorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "resume_profile",
        "skill_gap",
        "quiz_performance",
        "interview_feedback",
        "career_goal",
        "user_preference",
        "conversation_note",
        "general"
      ],
      default: "general",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    importance: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    embedding: {
      type: [Number],
      default: [],
    },
    source: {
      type: String,
      enum: ["resume", "quiz", "interview", "chat", "manual", "system"],
      default: "system",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user memories efficiently
tessMemorySchema.index({ user: 1, category: 1, createdAt: -1 });

export default mongoose.model("TessMemory", tessMemorySchema);
