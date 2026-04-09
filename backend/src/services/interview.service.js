import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const extractJSON = (text) => {
  const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  return match ? match[0] : text;
};

export const generateQuestions = async (role, skills, level) => {
  const prompt = `
Generate 5 interview questions for:
Role: ${role}
Skills: ${skills.join(", ")}
Level: ${level}

Also provide ideal answers.
Return ONLY JSON format:
[
 { "question": "...", "idealAnswer": "..." }
]
`;

  const res = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
  });

  return JSON.parse(extractJSON(res.choices[0].message.content));
};
export const evaluateAnswer = async (question, ideal, userAnswer) => {
  const prompt = `
Question: ${question}
Ideal Answer: ${ideal}
User Answer: ${userAnswer}

Give:
1. Score (out of 10)
2. Feedback
3. Improvement tips

Return ONLY JSON format:
{ "score": 8, "feedback": "...", "tips": "..." }
`;

  const res = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
  });

  return JSON.parse(extractJSON(res.choices[0].message.content));
}; 

