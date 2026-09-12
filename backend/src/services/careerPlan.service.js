import Groq from "groq-sdk";
import CareerPlan from "../models/careerPlan.model.js";
import TessMemory from "../models/tessMemory.model.js";
import { createMemory } from "./tess.service.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateCareerPlanFromAI = async ({
  userId,
  targetRole,
  targetCompany = "Top Tech",
  targetTimeline = "3 Months",
  weeklyCommitmentHours = 10,
}) => {
  try {
    // 1. Fetch user's known skill gaps & resume highlights from Tess's memory vault
    const memories = await TessMemory.find({ user: userId }).lean();
    const gaps = memories
      .filter((m) => m.category === "skill_gap" || m.category === "resume_profile")
      .map((m) => `${m.title}: ${m.content}`)
      .join("\n");

    const quizHistory = memories
      .filter((m) => m.category === "quiz_performance")
      .map((m) => `${m.title}: ${m.content}`)
      .join("\n");

    const prompt = `
You are an executive career coach and technical engineering mentor.
Create a high-impact, actionable 4-phase Career Preparation Plan for a candidate targeting:
- Role: ${targetRole}
- Target Company / Profile: ${targetCompany}
- Timeline: ${targetTimeline}
- Weekly Study Hours: ${weeklyCommitmentHours} hrs/week

CANDIDATE CONTEXT & KNOWN GAPS (From Profile & Assessments):
${gaps || "Candidate is starting their preparation journey."}

RECENT ASSESSMENT SIGNALS:
${quizHistory || "No quiz assessments yet."}

RULES:
- Provide exactly 4 sequential milestones:
  Phase 1: Foundation & Critical Gap Closure
  Phase 2: Advanced Core & Architecture Mastery
  Phase 3: Real-world Portfolio Projects & System Design
  Phase 4: Interview Drills, Behavioral (STAR), and Job Application Sprint
- Each milestone must have 3-4 specific, actionable tasks with clear skill tags and resource recommendations (e.g., Course, Documentation, Quiz, Interview, Project).
- Estimate realistic weeks per phase.
- Provide a punchy "weeklyFocus" summary.
- Return strictly a valid JSON object matching this structure:

{
  "weeklyFocus": "Short 1-2 sentence focus for this week",
  "overallReadiness": 30,
  "milestones": [
    {
      "phaseNumber": 1,
      "title": "Phase 1: ...",
      "description": "Short explanation of phase goals",
      "estimatedWeeks": 2,
      "tasks": [
        {
          "title": "Clear task title",
          "description": "Actionable detail on what to learn or build",
          "skills": ["Skill1", "Skill2"],
          "resourceType": "Documentation | Course | Quiz | Interview | Project",
          "resourceRecommendation": "e.g., Official Docs / LeetCode / Course Name"
        }
      ]
    }
  ]
}
`;

    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        { role: "system", content: "You generate career execution roadmaps in strict JSON format." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const raw = response.choices[0]?.message?.content || "{}";
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("AI career plan parse error:", e);
      throw new Error("Invalid AI response format");
    }

    // Upsert the user's plan
    let plan = await CareerPlan.findOne({ user: userId });
    if (!plan) {
      plan = new CareerPlan({
        user: userId,
        targetRole,
        targetCompany,
        targetTimeline,
        weeklyCommitmentHours,
        weeklyFocus: data.weeklyFocus || "Close core skill gaps and build hands-on mastery.",
        overallReadiness: data.overallReadiness || 25,
        milestones: data.milestones || [],
      });
    } else {
      plan.targetRole = targetRole;
      plan.targetCompany = targetCompany;
      plan.targetTimeline = targetTimeline;
      plan.weeklyCommitmentHours = weeklyCommitmentHours;
      plan.weeklyFocus = data.weeklyFocus || plan.weeklyFocus;
      plan.overallReadiness = data.overallReadiness || plan.overallReadiness;
      plan.milestones = data.milestones || [];
    }

    await plan.save();

    // Ingest into Tess Memory
    await createMemory({
      userId,
      category: "career_goal",
      title: `Career Roadmap: ${targetRole} @ ${targetCompany}`,
      content: `Targeting ${targetRole} within ${targetTimeline} (${weeklyCommitmentHours} hrs/week). Active 4-phase plan generated. Current Weekly Focus: ${plan.weeklyFocus}`,
      tags: [targetRole.toLowerCase(), targetCompany.toLowerCase(), "career-plan", "roadmap"],
      importance: 9,
      source: "system",
      metadata: { targetRole, targetCompany, targetTimeline },
    }).catch((err) => console.error("Tess memory sync error:", err));

    return plan;
  } catch (error) {
    console.error("Error generating career plan:", error);
    throw error;
  }
};
