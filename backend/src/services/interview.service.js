import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const extractJSON = (text) => {
  const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  return match ? match[0] : text;
};

export const generateQuestions = async (role, skills, level, mode = "general") => {
  let modeInstructions = "";
  if (mode === "star") {
    modeInstructions = `Focus STRICTLY on Behavioral and Leadership questions following the STAR (Situation, Task, Action, Result) methodology. Ask scenario-based questions like "Tell me about a time...", "Describe a situation where...", "How did you handle a production outage or team disagreement...".`;
  } else if (mode === "technical") {
    modeInstructions = `Focus on Deep Technical Knowledge, algorithm trade-offs, language internals, concurrency, database indexing, and core runtime performance.`;
  } else if (mode === "system_design") {
    modeInstructions = `Focus on System Design, Architecture, Distributed Systems, Microservices, Caching (Redis), Load Balancing, Sharding, and Failure Recovery.`;
  } else if (mode === "rapid_fire") {
    modeInstructions = `Focus on Rapid-Fire conceptual questions that can be answered cleanly in 60 seconds. Test quick technical intuition and core definitions.`;
  } else {
    modeInstructions = `Blend technical domain fundamentals with practical problem-solving.`;
  }

  const skillsList = Array.isArray(skills) ? skills.join(", ") : (skills || "General Engineering");

  const prompt = `
Generate 5 interview questions for:
Role: ${role}
Skills: ${skillsList}
Level: ${level}
Practice Mode: ${mode}

${modeInstructions}

Provide realistic, top-tier tech company interview questions with comprehensive ideal answers.
Return strictly a valid JSON array format:
[
  {
    "question": "Clear, realistic interview question",
    "idealAnswer": "Comprehensive model response demonstrating senior-level competence and clear structure."
  }
]
`;

  const res = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "qwen/qwen3.8-27b",
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0]?.message?.content || "[]";
  try {
    const parsed = JSON.parse(extractJSON(raw));
    if (Array.isArray(parsed)) return parsed;
    if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
    const firstArr = Object.values(parsed).find((v) => Array.isArray(v));
    if (firstArr) return firstArr;
    return [];
  } catch (err) {
    console.error("Failed to parse generated interview questions:", err);
    throw new Error("Invalid AI question generation format");
  }
};

export const evaluateAnswer = async (question, ideal, userAnswer, mode = "general") => {
  const prompt = `
You are a Staff Technical Interviewer evaluating a candidate's spoken/written response.

QUESTION:
${question}

IDEAL MODEL ANSWER:
${ideal}

CANDIDATE'S ACTUAL ANSWER:
${userAnswer || "(Candidate provided no answer or very brief statement)"}

INTERVIEW MODE:
${mode}

EVALUATION CRITERIA:
1. Overall Score (out of 10)
2. Granular 5-Pillar Metrics (0 to 10 each):
   - accuracy: Correctness of facts, algorithms, or concepts
   - clarity: Articulation, conciseness, lack of filler
   - structure: Logical flow (STAR method for behavioral, SCALE for architecture)
   - completeness: Did they address all parts of the question?
   - confidence: Decisiveness and depth
3. If mode is "star" or behavioral question, provide explicit feedback on each STAR pillar:
   - situation: Was context clear?
   - task: Was their specific role defined?
   - action: Did they explain what THEY personally did?
   - result: Was there a quantifiable outcome?
4. keyStrengths (2-3 concise points)
5. areasForImprovement (2-3 concrete tips)

Return strictly a valid JSON object matching:
{
  "score": 8,
  "feedback": "Concise 2-3 sentence overall assessment",
  "tips": "Specific actionable coaching tip",
  "metrics": {
    "accuracy": 8,
    "clarity": 7,
    "structure": 8,
    "completeness": 8,
    "confidence": 7
  },
  "starBreakdown": {
    "situation": "Strong context provided.",
    "task": "Clearly stated the goal.",
    "action": "Explained architectural changes made.",
    "result": "Lacked specific quantitative metrics (e.g. % improvement)."
  },
  "keyStrengths": ["Direct and relevant", "Good domain terminology"],
  "areasForImprovement": ["Include quantifiable results", "Avoid repeating introductory phrases"]
}
`;

  const res = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "qwen/qwen3.8-27b",
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0]?.message?.content || "{}";
  try {
    const data = JSON.parse(extractJSON(raw));
    return {
      score: Number(data.score) || 6,
      feedback: data.feedback || "Answer reviewed.",
      tips: data.tips || "Review the ideal answer for comparison.",
      metrics: {
        accuracy: Number(data.metrics?.accuracy) || Number(data.score) || 6,
        clarity: Number(data.metrics?.clarity) || 7,
        structure: Number(data.metrics?.structure) || 7,
        completeness: Number(data.metrics?.completeness) || 6,
        confidence: Number(data.metrics?.confidence) || 7,
      },
      starBreakdown: data.starBreakdown || {
        situation: "",
        task: "",
        action: "",
        result: "",
      },
      keyStrengths: Array.isArray(data.keyStrengths) ? data.keyStrengths : ["Addressed the question"],
      areasForImprovement: Array.isArray(data.areasForImprovement) ? data.areasForImprovement : ["Practice structuring key points"],
    };
  } catch (err) {
    console.error("Evaluation parse error:", err);
    return {
      score: 6,
      feedback: "Answer evaluated.",
      tips: "Practice structuring your response using the STAR method.",
      metrics: { accuracy: 6, clarity: 6, structure: 6, completeness: 6, confidence: 6 },
      starBreakdown: { situation: "", task: "", action: "", result: "" },
      keyStrengths: ["Attempted response"],
      areasForImprovement: ["Add more technical depth"],
    };
  }
};
