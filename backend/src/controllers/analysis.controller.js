import Groq from "groq-sdk";
import extractTextFromPDF from "../utils/pdfParser.js";
import fs from "fs";
import { ingestResumeAnalysis, createMemory } from "../services/tess.service.js";
import TessMemory from "../models/tessMemory.model.js";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const analyzeGap = async (req, res) => {
    try { 
               
              
              console.log("FILE PATH:", req.file.path);
              console.log("FILE EXISTS:", fs.existsSync(req.file.path));
        const { targetRole, companyName } = req.body;

        if (!req.file || req.file.size === 0) {
            return res.status(400).json({
                success: false,
                message: "Uploaded file is empty or missing"
            });
        }

        if (!targetRole || !companyName) {
            return res.status(400).json({
                success: false,
                message: "Target role and company name are required"
            });
        }

        const resumeText = await extractTextFromPDF(req.file.path);

        if (!resumeText || resumeText.trim().length < 50) {
            if (req.file?.path) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: "The uploaded PDF appears to be empty or contains insufficient text for analysis."
            });
        }

        if (req.file?.path) {
            fs.unlinkSync(req.file.path);
        }

        const prompt = `
You are an expert AI career coach and recruiter.

Analyze the provided text to determine if it is a professional Resume or CV.

Text:
${resumeText}

If the text is NOT a resume (e.g., random sentences, a blank page, a story, a technical manual, or irrelevant content), you MUST return only this JSON structure:
{
  "isResume": false,
  "rejectionReason": "Specific reason why this is not considered a resume"
}

If it IS a resume, analyze it for the role of ${targetRole} at ${companyName}.
Return ONLY a valid JSON object with this structure:
{
  "isResume": true,
  "currentSkills": {
    "languages": [],
    "frontend": [],
    "backend": [],
    "tools": [],
    "databases": [],
    "coreConcepts": []
  },
  "missingSkills": {
    "languages": [],
    "frontend": [],
    "backend": [],
    "tools": [],
    "cloud": [],
    "coreConcepts": []
  },
  "gapAnalysis": [
    {
      "skill": "",
      "reason": "",
      "importance": "High | Medium | Low"
    }
  ],
  "matchScore": 0,
  "interviewReadiness": {
    "level": "Beginner | Intermediate | Advanced",
    "notes": ""
  },
  "suggestions": [
    {
      "title": "",
      "description": "",
      "priority": "High | Medium | Low"
    }
  ],
  "roadmap": [
    {
      "step": "",
      "description": ""
    }
  ],
  "resources": [
    {
      "skill": "",
      "type": "Course | Documentation | Video",
      "recommendation": ""
    }
  ]
}

Rules:
- matchScore: 0-100
- Be specific to ${companyName}'s hiring expectations
- Do NOT include any explanation outside JSON
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "qwen/qwen3.8-27b",
            response_format: { type: "json_object" }
        });

        let data;
        try {
            data = JSON.parse(chatCompletion.choices[0].message.content);
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: "Invalid response from AI engine"
            });
        }

        if (data.isResume === false) {
            return res.status(400).json({
                success: false,
                message: data.rejectionReason || "The uploaded document does not appear to be a professional resume.",
                isInvalidContent: true
            });
        }

        // Auto-ingest into Tess memory if user is authenticated
        if (req.user?._id) {
            ingestResumeAnalysis(req.user._id, targetRole, companyName, data).catch((err) => {
                console.error("Tess resume memory ingestion background error:", err);
            });
        }

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        console.error("GROQ ERROR:", error);

      
        if (req.file?.path) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            success: false,
            message: "Groq Analysis failed",
            error: error.message
        });
    }
};

const matchJobDescription = async (req, res) => {
    try {
        const { targetRole, companyName, jobDescription } = req.body;
        const userId = req.user?._id;

        if (!jobDescription || jobDescription.trim().length < 30) {
            if (req.file?.path) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: "Please provide a detailed Job Description (at least 30 characters)."
            });
        }

        let resumeText = "";

        // Option A: Extract from newly uploaded PDF
        if (req.file && req.file.path) {
            resumeText = await extractTextFromPDF(req.file.path);
            fs.unlinkSync(req.file.path);
        }

        // Option B: If no PDF was uploaded, look up user's existing resume memories in Tess
        if ((!resumeText || resumeText.trim().length < 50) && userId) {
            const memory = await TessMemory.findOne({
                user: userId,
                category: "resume_profile"
            }).sort({ createdAt: -1 });

            if (memory) {
                resumeText = `${memory.title}\n${memory.content}`;
            }
        }

        if (!resumeText || resumeText.trim().length < 30) {
            return res.status(400).json({
                success: false,
                message: "Resume data missing. Please upload a PDF resume or complete a Resume Analysis first."
            });
        }

        const prompt = `
You are an expert ATS (Applicant Tracking System) optimizer, technical recruiter, and career coach.
Compare the Candidate's Resume against the Target Job Description (JD).

CANDIDATE RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
Target Role: ${targetRole || "Specified in JD"}
Company: ${companyName || "Target Company"}
JD Text:
${jobDescription}

Perform a rigorous, line-by-line ATS match comparison.
Return strictly a valid JSON object matching this structure:
{
  "matchScore": 75,
  "fitVerdict": "Strong Match | Moderate Match | Reach Role",
  "summary": "2-3 sentence executive summary of candidate fit",
  "matchedSkills": ["Skill A", "Skill B"],
  "missingSkills": ["Skill C", "Skill D"],
  "atsKeywords": [
    {
      "keyword": "Kubernetes",
      "inResume": false,
      "importance": "High | Medium"
    }
  ],
  "bulletPointSuggestions": [
    {
      "skill": "Target skill from JD",
      "originalConcept": "Typical bullet on resume",
      "optimizedBullet": "Action-oriented bullet using XYZ formula tailored for this JD",
      "rationale": "Why this aligns better with ATS"
    }
  ],
  "interviewProbability": "High | Medium | Low"
}

Rules:
- matchScore must be an integer 0-100 based strictly on hard skill overlap
- Provide 3-5 high-impact bulletPointSuggestions
- Do NOT output anything outside the JSON object.
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "qwen/qwen3.8-27b",
            response_format: { type: "json_object" }
        });

        let data;
        try {
            data = JSON.parse(chatCompletion.choices[0].message.content);
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: "Invalid response from AI engine"
            });
        }

        // Auto-save to Tess Memory
        if (userId) {
            createMemory({
                userId,
                category: "skill_gap",
                title: `JD Match: ${targetRole || "Role"} @ ${companyName || "Company"} (${data.matchScore}%)`,
                content: `ATS Score: ${data.matchScore}%. Fit: ${data.fitVerdict}. Missing Skills: ${data.missingSkills?.join(", ")}.`,
                tags: ["jd-match", (companyName || "").toLowerCase(), (targetRole || "").toLowerCase()],
                importance: 8,
                source: "resume"
            }).catch(err => console.error("Tess memory JD sync error:", err));
        }

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        console.error("JD Match Error:", error);
        if (req.file?.path) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
            success: false,
            message: "Job Description match analysis failed",
            error: error.message
        });
    }
};

export { analyzeGap, matchJobDescription };