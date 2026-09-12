import mongoose from "mongoose";

const interviewRoundSchema = new mongoose.Schema({
  roundName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
  },
  feedback: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "passed", "failed"],
    default: "scheduled",
  },
});

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: "Remote",
    },
    salary: {
      type: String,
      default: "",
    },
    jobUrl: {
      type: String,
      default: "",
    },
    jobDescription: {
      type: String,
      default: "",
    },
    matchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["wishlist", "applied", "interviewing", "offer", "rejected"],
      default: "applied",
      index: true,
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    nextInterviewDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
    interviewRounds: [interviewRoundSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user filtering by status
applicationSchema.index({ user: 1, status: 1, createdAt: -1 });

export default mongoose.model("Application", applicationSchema);
