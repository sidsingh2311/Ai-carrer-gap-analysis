import CareerPlan from "../models/careerPlan.model.js";
import { generateCareerPlanFromAI } from "../services/careerPlan.service.js";
import { createMemory } from "../services/tess.service.js";

/**
 * Get active career plan for user
 */
export const getCareerPlan = async (req, res) => {
  try {
    const userId = req.user?._id;
    const plan = await CareerPlan.findOne({ user: userId });

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Error fetching career plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch career plan",
      error: error.message,
    });
  }
};

/**
 * Generate or regenerate a career plan using AI
 */
export const generatePlan = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { targetRole, targetCompany, targetTimeline, weeklyCommitmentHours } = req.body;

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: "Target role is required to generate a career plan",
      });
    }

    const plan = await generateCareerPlanFromAI({
      userId,
      targetRole,
      targetCompany: targetCompany || "Top Tech",
      targetTimeline: targetTimeline || "3 Months",
      weeklyCommitmentHours: Number(weeklyCommitmentHours) || 10,
    });

    return res.status(200).json({
      success: true,
      message: "Personalized Career Plan generated successfully",
      data: plan,
    });
  } catch (error) {
    console.error("Error generating career plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate career plan",
      error: error.message,
    });
  }
};

/**
 * Toggle a task's completion status
 */
export const toggleTaskStatus = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { milestoneId, taskId } = req.body;

    const plan = await CareerPlan.findOne({ user: userId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Career plan not found",
      });
    }

    const milestone = plan.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: "Milestone not found",
      });
    }

    const task = milestone.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.isCompleted = !task.isCompleted;

    // Trigger pre-save recalculation
    await plan.save();

    // If task was just completed, record milestone in Tess memory
    if (task.isCompleted) {
      createMemory({
        userId,
        category: "career_goal",
        title: `Completed Task: ${task.title}`,
        content: `Candidate completed task "${task.title}" in ${milestone.title}. Plan overall progress is now ${plan.progressPercentage}%.`,
        tags: ["task-completed", ...task.skills],
        importance: 6,
        source: "system",
      }).catch((err) => console.error("Memory sync err:", err));
    }

    return res.status(200).json({
      success: true,
      message: task.isCompleted ? "Task marked completed" : "Task marked incomplete",
      data: plan,
    });
  } catch (error) {
    console.error("Error toggling task status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update task status",
      error: error.message,
    });
  }
};

/**
 * Update user's current weekly focus
 */
export const updateWeeklyFocus = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { weeklyFocus } = req.body;

    const plan = await CareerPlan.findOne({ user: userId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Career plan not found",
      });
    }

    plan.weeklyFocus = weeklyFocus || plan.weeklyFocus;
    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Weekly focus updated successfully",
      data: plan,
    });
  } catch (error) {
    console.error("Error updating weekly focus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update weekly focus",
      error: error.message,
    });
  }
};
