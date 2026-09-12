import mongoose from "mongoose";

const tessMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  retrievedMemories: [
    {
      memoryId: { type: mongoose.Schema.Types.ObjectId, ref: "TessMemory" },
      title: String,
      category: String,
    },
  ],
  suggestions: [
    {
      title: String,
      description: String,
      actionType: {
        type: String,
        enum: ["quiz", "interview", "resume", "link", "chat"],
        default: "chat",
      },
      actionPayload: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const tessConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Career Advisory Session",
      trim: true,
    },
    messages: [tessMessageSchema],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("TessConversation", tessConversationSchema);
