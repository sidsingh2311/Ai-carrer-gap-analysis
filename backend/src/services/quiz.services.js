import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateQuizFromAI = async (role, company, skills = []) => {
  const prompt = `
Generate 10 multiple choice questions for a ${role} role at ${company}.

Focus ONLY on these relevant skills: ${skills.join(", ")}

Return strictly in JSON format:
{
  "questions": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correctAnswer": 0
    }
  ]
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You generate technical interview quizzes." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    let text = response.choices[0]?.message?.content || "";

    // Clean markdown if present
    text = text.replace(/```json|```/g, "").trim();

    // Safe JSON parsing
    try {
      return JSON.parse(text);
    } catch (err) {
      console.log("Raw AI Response:", text);
      throw new Error("Invalid JSON from AI");
    }

  } catch (error) {
    console.error("Groq Quiz Generation Error:", error);
    throw new Error("Failed to generate quiz");
  }
};