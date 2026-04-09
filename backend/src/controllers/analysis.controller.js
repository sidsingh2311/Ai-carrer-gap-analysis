import Groq from "groq-sdk";
import extractTextFromPDF from "../utils/pdfParser.js";
import fs from "fs";

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
            model: "llama-3.3-70b-versatile",
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

export { analyzeGap };