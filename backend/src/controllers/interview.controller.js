import Interview from "../models/interview.model.js";
import {
  generateQuestions,
  evaluateAnswer,
} from "../services/interview.service.js"; 
import { ingestInterviewResult, createMemory } from "../services/tess.service.js"; 
 
// Start a new mock interview session with mode support
export const startInterview = async (req, res) => {
    try {
        const { role, skills, level, company, mode } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: "Role is required to start an interview"
            });
        }

        const selectedMode = mode || "general";

        // Generate questions from Groq AI
        const questions = await generateQuestions(role, skills, level || "intermediate", selectedMode);

        const interview = await Interview.create({
            user: req.user._id,
            role,
            company: company || "Top Tech",
            skills: Array.isArray(skills) ? skills : (skills ? [skills] : []),
            level: level || "intermediate",
            mode: selectedMode,
            questions,
        });

        return res.status(200).json({
            success: true,
            message: "Started the interview",
            data: interview
        });
    } catch (error) {
        console.error("Start interview error:", error);
        return res.status(500).json({
            success: false,
            message: "Error starting the interview",
            error: error.message,
            data: {}
        });
    }
};

// Submit an answer to the current question
export const submitAnswer = async (req, res) => {
    try {
        const { interviewId, userAnswer } = req.body;
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found"
            });
        }

        const index = interview.currentQuestionIndex;
        const currentQuestion = interview.questions[index];

        if (!currentQuestion) {
            return res.status(400).json({
                success: false,
                message: "Invalid question index"
            });
        }

        // Evaluate answer with 5-pillar analytics and mode support
        const evaluation = await evaluateAnswer(
            currentQuestion.question,
            currentQuestion.idealAnswer || currentQuestion.answer,
            userAnswer,
            interview.mode || "general"
        );

        // Save question feedback and granular metrics
        currentQuestion.userAnswer = userAnswer || "";
        currentQuestion.feedback = evaluation.feedback;
        currentQuestion.score = evaluation.score;
        currentQuestion.metrics = evaluation.metrics;
        currentQuestion.starBreakdown = evaluation.starBreakdown;
        currentQuestion.keyStrengths = evaluation.keyStrengths;
        currentQuestion.areasForImprovement = evaluation.areasForImprovement;

        // Move to next question
        interview.currentQuestionIndex = interview.currentQuestionIndex + 1;

        // Check if all questions are finished
        if (interview.currentQuestionIndex >= interview.questions.length) {
            interview.status = "completed";

            // Calculate overall averages across questions
            const totalQuestions = interview.questions.length;
            let sumScore = 0;
            let sumAccuracy = 0;
            let sumClarity = 0;
            let sumStructure = 0;
            let sumCompleteness = 0;
            let sumConfidence = 0;

            interview.questions.forEach((q) => {
                sumScore += q.score || 0;
                sumAccuracy += q.metrics?.accuracy || q.score || 0;
                sumClarity += q.metrics?.clarity || 7;
                sumStructure += q.metrics?.structure || 7;
                sumCompleteness += q.metrics?.completeness || 6;
                sumConfidence += q.metrics?.confidence || 7;
            });

            interview.overallScore = Math.round((sumScore / (totalQuestions * 10)) * 100);
            interview.categoryAverages = {
                accuracy: parseFloat((sumAccuracy / totalQuestions).toFixed(1)),
                clarity: parseFloat((sumClarity / totalQuestions).toFixed(1)),
                structure: parseFloat((sumStructure / totalQuestions).toFixed(1)),
                completeness: parseFloat((sumCompleteness / totalQuestions).toFixed(1)),
                confidence: parseFloat((sumConfidence / totalQuestions).toFixed(1)),
            };

            await interview.save();

            // Auto-ingest into Tess memory vault
            ingestInterviewResult(interview.user, interview).catch((err) => {
                console.error("Tess interview memory ingestion error:", err);
            });

            return res.status(200).json({
                completed: true,
                message: "Interview completed",
                interview,
                evaluation
            });
        }

        await interview.save();

        return res.status(200).json({
            completed: false,
            interview,
            evaluation,
            nextQuestion: interview.questions[interview.currentQuestionIndex]
        });

    } catch (error) {
        console.error("Submit answer error:", error);
        return res.status(500).json({
            success: false,
            message: "Error submitting the answer",
            error: error.message,
            data: {}
        });
    }
};

// Get past interviews and overall analytics for the user
export const getUserInterviews = async (req, res) => {
    try {
        const userId = req.user?._id;
        const interviews = await Interview.find({ user: userId }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: interviews
        });
    } catch (error) {
        console.error("Get user interviews error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch interviews",
            error: error.message
        });
    }
};
