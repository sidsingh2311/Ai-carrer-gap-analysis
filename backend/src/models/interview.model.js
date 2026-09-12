import mongoose from "mongoose";

// creating the question schema 
const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    idealAnswer: {
        type: String,
    },
    userAnswer: {
        type: String,
        default: ""
    },
    feedback: {
        type: String,
        default: ""
    },
    score: {
        type: Number,
        default: 0
    },
    metrics: {
        accuracy: { type: Number, default: 0 },
        clarity: { type: Number, default: 0 },
        structure: { type: Number, default: 0 },
        completeness: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
    },
    starBreakdown: {
        situation: { type: String, default: "" },
        task: { type: String, default: "" },
        action: { type: String, default: "" },
        result: { type: String, default: "" },
    },
    keyStrengths: {
        type: [String],
        default: []
    },
    areasForImprovement: {
        type: [String],
        default: []
    }
}) 

// creating the interview schema 
const interviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    role: {
        type: String,
        required: true,
    },
    company: {
        type: String,
        default: "Top Tech",
    },
    level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        required: true
    },
    mode: {
        type: String,
        enum: ["general", "star", "technical", "system_design", "rapid_fire"],
        default: "general"
    },
    questions: [questionSchema],
    currentQuestionIndex: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ["in-progress", "completed"],
        default: "in-progress"
    },
    overallScore: {
        type: Number,
        default: 0
    },
    categoryAverages: {
        accuracy: { type: Number, default: 0 },
        clarity: { type: Number, default: 0 },
        structure: { type: Number, default: 0 },
        completeness: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
    }
},
{
    timestamps: true
}) 

export default mongoose.model("interview", interviewSchema);
