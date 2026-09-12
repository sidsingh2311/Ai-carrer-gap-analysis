import Application from "../models/application.model.js";
import { createMemory } from "../services/tess.service.js";

/**
 * Get all applications for user with pipeline summary stats
 */
export const getApplications = async (req, res) => {
  try {
    const userId = req.user?._id;
    const applications = await Application.find({ user: userId }).sort({ updatedAt: -1 });

    const stats = {
      total: applications.length,
      wishlist: applications.filter((a) => a.status === "wishlist").length,
      applied: applications.filter((a) => a.status === "applied").length,
      interviewing: applications.filter((a) => a.status === "interviewing").length,
      offer: applications.filter((a) => a.status === "offer").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    };

    return res.status(200).json({
      success: true,
      data: {
        applications,
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

/**
 * Create a new application entry
 */
export const createApplication = async (req, res) => {
  try {
    const userId = req.user?._id;
    const {
      company,
      role,
      location,
      salary,
      jobUrl,
      jobDescription,
      matchScore,
      status,
      appliedDate,
      nextInterviewDate,
      notes,
    } = req.body;

    if (!company || !role) {
      return res.status(400).json({
        success: false,
        message: "Company and Role are required",
      });
    }

    const application = await Application.create({
      user: userId,
      company,
      role,
      location: location || "Remote",
      salary: salary || "",
      jobUrl: jobUrl || "",
      jobDescription: jobDescription || "",
      matchScore: Number(matchScore) || 0,
      status: status || "applied",
      appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
      nextInterviewDate: nextInterviewDate ? new Date(nextInterviewDate) : null,
      notes: notes || "",
    });

    // Ingest into Tess Memory
    createMemory({
      userId,
      category: "career_goal",
      title: `Job Application: ${role} @ ${company}`,
      content: `User submitted application for ${role} at ${company} (Status: ${application.status}). Match Score: ${application.matchScore}%. Notes: ${notes || "None"}.`,
      tags: [company.toLowerCase(), role.toLowerCase(), "application", application.status],
      importance: 7,
      source: "system",
    }).catch((err) => console.error("Memory sync err:", err));

    return res.status(201).json({
      success: true,
      message: "Application logged successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error creating application:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to log application",
      error: error.message,
    });
  }
};

/**
 * Update an existing application
 */
export const updateApplication = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const application = await Application.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: req.body },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application updated successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error updating application:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update application",
      error: error.message,
    });
  }
};

/**
 * Quick status update
 */
export const updateStatus = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["wishlist", "applied", "interviewing", "offer", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const application = await Application.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { status } },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // If moved to Interviewing or Offer, notify Tess memory!
    if (status === "interviewing" || status === "offer") {
      createMemory({
        userId,
        category: "career_goal",
        title: `Milestone: ${status === "offer" ? "JOB OFFER" : "Interview Scheduled"} @ ${application.company}!`,
        content: `Candidate reached ${status.toUpperCase()} stage for ${application.role} at ${application.company}!`,
        tags: [status, application.company.toLowerCase(), application.role.toLowerCase()],
        importance: 10,
        source: "system",
      }).catch((err) => console.error("Memory sync err:", err));
    }

    return res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: application,
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};

/**
 * Delete an application
 */
export const deleteApplication = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const deleted = await Application.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Application not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete application",
      error: error.message,
    });
  }
};
