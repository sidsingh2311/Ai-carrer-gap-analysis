import Groq from "groq-sdk";
import TessMemory from "../models/tessMemory.model.js";
import quizresultModel from "../models/quizresult.model.js";
import Interview from "../models/interview.model.js";
import User from "../models/user.model.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Curated career domain knowledge base chunks for RAG grounding
 */
const CAREER_DOMAIN_KNOWLEDGE = [
  {
    id: "kb-star-method",
    title: "STAR Method for Behavioral Interviews",
    tags: ["interview", "behavioral", "amazon", "google", "leadership"],
    content:
      "For behavioral questions (e.g., 'Tell me about a time you resolved a conflict'), structure responses with STAR: Situation (set the context in 2 sentences), Task (your specific responsibility), Action (concrete technical/leadership steps YOU took), and Result (quantifiable metrics, e.g., 'reduced latency by 35%').",
  },
  {
    id: "kb-system-design",
    title: "System Design Framework (SCALE)",
    tags: ["system design", "architecture", "scalability", "backend", "cloud"],
    content:
      "When designing distributed systems: 1) Clarify scope, functional and non-functional requirements (throughput, latency, availability vs consistency); 2) Estimate QPS, storage, and bandwidth; 3) Define high-level API & DB schema; 4) Draw core components (Load Balancers, API Gateway, App Servers, DB read-replicas, Cache layer with Redis); 5) Deep dive into bottlenecks, partition tolerance, and single points of failure.",
  },
  {
    id: "kb-ats-optimization",
    title: "ATS Resume Optimization Rules",
    tags: ["resume", "ats", "keywords", "gap"],
    content:
      "ATS systems parse for exact phrase matches from the job description. Bullet points must use the XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'. Avoid multi-column formatting, text boxes, and non-standard fonts which cause parsing dropouts.",
  },
  {
    id: "kb-dsa-strategy",
    title: "Data Structures & Algorithms Interview Prep",
    tags: ["dsa", "leetcode", "algorithms", "coding", "interviews"],
    content:
      "Top recurring patterns: Two Pointers, Sliding Window, Fast & Slow Pointers, Monotonic Stack, Top K Elements (Heaps), Graph BFS/DFS, and 1D/2D Dynamic Programming. Prioritize identifying the underlying pattern over memorizing individual solutions.",
  },
  {
    id: "kb-cloud-readiness",
    title: "Cloud & DevOps Core Competencies",
    tags: ["docker", "kubernetes", "cloud", "aws", "gcp", "devops"],
    content:
      "Modern backend roles require containerization fundamentals (multi-stage Dockerfiles, image caching), orchestration (K8s pods, services, deployments), CI/CD pipelines (GitHub Actions), and at least one public cloud provider (AWS/GCP/Azure) compute and storage primitives.",
  },
];

/**
 * Deterministic Semantic Vectorizer (dense 64-dim unit vector)
 * Generates an embedding representation from text for cosine similarity.
 */
export function generateLocalEmbedding(text = "") {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = clean.split(/\s+/).filter(Boolean);
  const dim = 64;
  const vector = new Array(dim).fill(0);

  if (tokens.length === 0) return vector;

  tokens.forEach((token, idx) => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % dim;
    const weight = 1.0 + (idx === 0 ? 0.5 : 0);
    vector[bucket] += weight;

    // Secondary projection for bigram spread
    const secBucket = Math.abs((hash * 31) ^ (token.length * 17)) % dim;
    vector[secBucket] += 0.5 * weight;
  });

  // Normalize to unit vector
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vector[i] = parseFloat((vector[i] / norm).toFixed(5));
    }
  }

  return vector;
}

/**
 * Computes cosine similarity between two vectors
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const minLen = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * RAG Retriever: Retrieves the most relevant memories for a user based on semantic similarity,
 * keyword matching, and importance weighting.
 */
export async function retrieveRelevantMemories(userId, queryText, topK = 6) {
  try {
    const queryVector = generateLocalEmbedding(queryText);
    const queryTokens = queryText.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    // Fetch all memories for the user
    const memories = await TessMemory.find({ user: userId }).lean();

    if (!memories || memories.length === 0) {
      return { userMemories: [], domainKnowledge: CAREER_DOMAIN_KNOWLEDGE.slice(0, 2) };
    }

    // Score each memory
    const scoredMemories = memories.map((mem) => {
      let vecScore = 0;
      if (mem.embedding && mem.embedding.length > 0) {
        vecScore = cosineSimilarity(queryVector, mem.embedding);
      } else {
        const memVec = generateLocalEmbedding(`${mem.title} ${mem.content} ${(mem.tags || []).join(" ")}`);
        vecScore = cosineSimilarity(queryVector, memVec);
      }

      // Keyword / tag overlap bonus
      let tagMatchCount = 0;
      const memText = `${mem.title} ${mem.content} ${(mem.tags || []).join(" ")}`.toLowerCase();
      queryTokens.forEach((token) => {
        if (memText.includes(token)) tagMatchCount++;
      });

      const keywordBonus = Math.min(tagMatchCount * 0.15, 0.45);
      const importanceBonus = ((mem.importance || 5) / 10) * 0.1;

      const totalScore = vecScore * 0.6 + keywordBonus + importanceBonus;

      return {
        ...mem,
        relevanceScore: totalScore,
      };
    });

    scoredMemories.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topMemories = scoredMemories.slice(0, topK);

    // Retrieve matching domain knowledge
    const scoredKnowledge = CAREER_DOMAIN_KNOWLEDGE.map((kb) => {
      const kbText = `${kb.title} ${kb.content} ${kb.tags.join(" ")}`.toLowerCase();
      let matchCount = 0;
      queryTokens.forEach((t) => {
        if (kbText.includes(t)) matchCount++;
      });
      return { ...kb, matchCount };
    });

    scoredKnowledge.sort((a, b) => b.matchCount - a.matchCount);
    const topDomainKnowledge = scoredKnowledge.slice(0, 2);

    return {
      userMemories: topMemories,
      domainKnowledge: topDomainKnowledge,
    };
  } catch (error) {
    console.error("Tess RAG Retrieval Error:", error);
    return { userMemories: [], domainKnowledge: [] };
  }
}

/**
 * Ingests a new memory item with auto-generated vector embedding
 */
export async function createMemory({
  userId,
  category,
  title,
  content,
  tags = [],
  importance = 5,
  source = "manual",
  metadata = {},
}) {
  const embeddingText = `${title} ${content} ${tags.join(" ")}`;
  const embedding = generateLocalEmbedding(embeddingText);

  const memory = await TessMemory.create({
    user: userId,
    category,
    title,
    content,
    tags,
    importance,
    embedding,
    source,
    metadata,
  });

  return memory;
}

/**
 * Auto-Ingest: Resume Analysis Results
 */
export async function ingestResumeAnalysis(userId, targetRole, companyName, analysisData) {
  if (!userId || !analysisData) return;

  try {
    // 1. Overall Profile Memory
    const currentSkillsSummary = Object.entries(analysisData.currentSkills || {})
      .filter(([_, list]) => Array.isArray(list) && list.length > 0)
      .map(([cat, list]) => `${cat}: ${list.join(", ")}`)
      .join(" | ");

    await createMemory({
      userId,
      category: "resume_profile",
      title: `Resume Profile: Targeting ${targetRole} at ${companyName}`,
      content: `Target Role: ${targetRole}. Company: ${companyName}. Match Score: ${analysisData.matchScore || 0}%. Readiness: ${
        analysisData.interviewReadiness?.level || "Unspecified"
      }. Strong Skills: ${currentSkillsSummary || "General Technical"}`,
      tags: [targetRole.toLowerCase(), companyName.toLowerCase(), "resume", "skills"],
      importance: 9,
      source: "resume",
      metadata: { targetRole, companyName, matchScore: analysisData.matchScore },
    });

    // 2. Critical Gaps Memory
    if (Array.isArray(analysisData.gapAnalysis) && analysisData.gapAnalysis.length > 0) {
      const topGaps = analysisData.gapAnalysis.slice(0, 5);
      const gapsDescription = topGaps
        .map((g) => `${g.skill} (${g.importance} priority): ${g.reason}`)
        .join("; ");

      const gapTags = topGaps.map((g) => g.skill.toLowerCase());

      await createMemory({
        userId,
        category: "skill_gap",
        title: `Identified Skill Gaps for ${targetRole} @ ${companyName}`,
        content: `Critical skill gaps identified from resume scan: ${gapsDescription}. Roadmap suggestions: ${
          analysisData.suggestions?.map((s) => s.title).join(", ") || "Practice weak topics"
        }`,
        tags: [...gapTags, "gap", "weakness", targetRole.toLowerCase()],
        importance: 8,
        source: "resume",
        metadata: { targetRole, companyName, gapsCount: analysisData.gapAnalysis.length },
      });
    }
  } catch (error) {
    console.error("Error in ingestResumeAnalysis:", error);
  }
}

/**
 * Auto-Ingest: Quiz Result
 */
export async function ingestQuizResult(userId, quizData) {
  if (!userId || !quizData) return;

  try {
    const percentage = quizData.percentage || Math.round((quizData.score / quizData.totalQuestions) * 100);
    const passed = percentage >= 70;
    const skillsList = quizData.skills || [];

    await createMemory({
      userId,
      category: "quiz_performance",
      title: `Quiz Assessment: ${quizData.role || "Technical"} (${percentage}%)`,
      content: `User scored ${quizData.score}/${quizData.totalQuestions} (${percentage}%) on ${
        quizData.role || "Technical Quiz"
      } targeting ${quizData.company || "General Tech"}. Tested Skills: ${skillsList.join(", ")}. Status: ${
        passed ? "Proficient" : "Needs Review"
      }. Feedback: ${quizData.feedback || "Assessment completed."}`,
      tags: [...skillsList.map((s) => s.toLowerCase()), "quiz", quizData.role?.toLowerCase() || "tech"],
      importance: passed ? 6 : 8,
      source: "quiz",
      metadata: { score: quizData.score, totalQuestions: quizData.totalQuestions, percentage, passed },
    });
  } catch (error) {
    console.error("Error in ingestQuizResult:", error);
  }
}

/**
 * Auto-Ingest: Interview Result
 */
export async function ingestInterviewResult(userId, interviewData) {
  if (!userId || !interviewData) return;

  try {
    const questions = interviewData.questions || [];
    let avgScore = 0;
    let feedbackSummary = "";

    if (questions.length > 0) {
      const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);
      avgScore = (totalScore / questions.length).toFixed(1);
      feedbackSummary = questions
        .filter((q) => q.feedback)
        .map((q) => `Q: "${q.question.slice(0, 40)}..." -> ${q.feedback}`)
        .slice(0, 3)
        .join(" | ");
    }

    await createMemory({
      userId,
      category: "interview_feedback",
      title: `Mock Interview: ${interviewData.role} (${interviewData.level})`,
      content: `Completed mock interview for ${interviewData.role} (${interviewData.level} level). Average Score: ${avgScore}/10. Performance insights: ${
        feedbackSummary || "Detailed technical evaluation conducted."
      }`,
      tags: [interviewData.role?.toLowerCase() || "interview", interviewData.level, "mock-interview"],
      importance: 8,
      source: "interview",
      metadata: { role: interviewData.role, level: interviewData.level, avgScore },
    });
  } catch (error) {
    console.error("Error in ingestInterviewResult:", error);
  }
}

/**
 * Scans existing user database records (quizzes, interviews) and syncs into Tess's memory vault
 */
export async function syncHistoricalUserData(userId) {
  if (!userId) return { synced: 0 };

  let syncedCount = 0;

  // 1. Check existing memories count
  const existingCount = await TessMemory.countDocuments({ user: userId });

  // 2. Fetch quizzes
  const quizzes = await quizresultModel.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean();
  for (const q of quizzes) {
    const exists = await TessMemory.findOne({
      user: userId,
      source: "quiz",
      "metadata.score": q.score,
      createdAt: { $gte: new Date(new Date(q.createdAt).getTime() - 1000) },
    });
    if (!exists) {
      await ingestQuizResult(userId, q);
      syncedCount++;
    }
  }

  // 3. Fetch interviews
  const interviews = await Interview.find({ user: userId, status: "completed" })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  for (const iv of interviews) {
    const exists = await TessMemory.findOne({
      user: userId,
      source: "interview",
      "metadata.role": iv.role,
    });
    if (!exists) {
      await ingestInterviewResult(userId, iv);
      syncedCount++;
    }
  }

  // 4. If brand new user with 0 memories, create a welcome base profile memory
  if (existingCount === 0 && syncedCount === 0) {
    const user = await User.findById(userId).lean();
    await createMemory({
      userId,
      category: "career_goal",
      title: "Initial Career Journey Baseline",
      content: `User ${user?.name || "Candidate"} (${user?.email}) began their career gap analysis path. Tess is listening and ready to learn skills, dream roles, and quiz milestones.`,
      tags: ["onboarding", "baseline"],
      importance: 5,
      source: "system",
    });
    syncedCount++;
  }

  return { synced: syncedCount, total: await TessMemory.countDocuments({ user: userId }) };
}

/**
 * Proactive Suggestion Generator: Computes 3-4 personalized recommendations
 * based on user's retrieved skill gaps, quiz scores, and goals.
 */
export async function generateProactiveSuggestions(userId) {
  try {
    const user = await User.findById(userId).select("name email").lean();
    const memories = await TessMemory.find({ user: userId }).sort({ importance: -1, createdAt: -1 }).limit(12).lean();

    if (!memories || memories.length === 0) {
      return [
        {
          title: "Upload Your Resume for AI Scan",
          description: "Let Tess analyze your background against top tech roles to identify your critical gaps.",
          actionType: "resume",
          actionPayload: { path: "/resume" },
          priority: "High",
        },
        {
          title: "Take a Diagnostic Quiz",
          description: "Test your fundamental technical skills with a 5-minute dynamic quiz.",
          actionType: "quiz",
          actionPayload: { path: "/quiz" },
          priority: "Medium",
        },
        {
          title: "Tell Tess Your Dream Role",
          description: "Share your target company or preferred tech stack directly in chat so Tess can personalize your prep.",
          actionType: "chat",
          actionPayload: { prompt: "I am targeting Full Stack Engineer at Microsoft. Help me prepare." },
          priority: "Medium",
        },
      ];
    }

    const memoryContext = memories
      .map((m) => `[${m.category.toUpperCase()}] ${m.title}: ${m.content}`)
      .join("\n");

    const prompt = `
You are Tess, an elite AI Career Copilot.
Analyze these stored memories for user "${user?.name || "Candidate"}":

${memoryContext}

Based STRICTLY on these real user details (their specific target role, skill gaps, quiz scores, and weak points), generate 3 to 4 personalized, concrete action suggestions for today.

Return ONLY a valid JSON array matching this exact structure:
[
  {
    "title": "Short punchy title referencing their specific skill or goal",
    "description": "Clear 1-2 sentence actionable advice",
    "actionType": "quiz" | "interview" | "resume" | "chat",
    "actionPayload": {
      "path": "/quiz" or "/interview" or "/resume",
      "suggestedRole": "Role name if relevant",
      "suggestedSkills": ["skill1", "skill2"],
      "prompt": "Recommended message to send Tess if actionType is chat"
    },
    "priority": "High" | "Medium" | "Low"
  }
]
`;

    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const raw = response.choices[0]?.message?.content || "";
    let parsed;
    try {
      const clean = raw.trim();
      parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) return parsed.suggestions;
      // Fallback extraction
      const firstArray = Object.values(parsed).find((v) => Array.isArray(v));
      if (firstArray) return firstArray;
    } catch (e) {
      console.error("Failed to parse proactive suggestions JSON:", raw);
    }

    // Fallback safe suggestions
    return [
      {
        title: "Targeted Skill Quiz",
        description: "Practice the technical gaps identified in your latest assessments.",
        actionType: "quiz",
        actionPayload: { path: "/quiz" },
        priority: "High",
      },
      {
        title: "AI Mock Interview Practice",
        description: "Test your verbal technical explanation with an AI mock session.",
        actionType: "interview",
        actionPayload: { path: "/interview" },
        priority: "Medium",
      },
    ];
  } catch (error) {
    console.error("Tess Suggestion Generation Error:", error);
    return [];
  }
}

/**
 * Chat with Tess (RAG-Augmented)
 */
export async function chatWithTessService({ userId, userMessage, conversationHistory = [] }) {
  try {
    const user = await User.findById(userId).select("name email").lean();

    // 1. RAG Retrieval
    const { userMemories, domainKnowledge } = await retrieveRelevantMemories(userId, userMessage, 6);

    // Format retrieved context
    const userMemoryBlock =
      userMemories.length > 0
        ? userMemories
            .map((m, idx) => `Memory ${idx + 1} [${m.category}]: ${m.title} -> ${m.content}`)
            .join("\n")
        : "No prior memories recorded yet. This user is just beginning.";

    const domainKnowledgeBlock =
      domainKnowledge.length > 0
        ? domainKnowledge.map((k) => `Reference [${k.title}]: ${k.content}`).join("\n")
        : "";

    // 2. System Instructions with Persona
    const systemPrompt = `
You are Tess, a world-class, hyper-personalized AI Career Copilot and Mentor.
You are talking to ${user?.name || "your mentee"}.

YOUR MEMORY OF THIS USER (Retrieved via RAG):
--------------------------------------------------
${userMemoryBlock}
--------------------------------------------------

INDUSTRY DOMAIN KNOWLEDGE:
--------------------------------------------------
${domainKnowledgeBlock}
--------------------------------------------------

YOUR INSTRUCTIONS:
1. ALWAYS personalize your answer using the user's specific details from the retrieved memory (e.g. mention their target role, dream company, specific quiz scores, or exact missing skills if relevant to the question).
2. Never say "According to my database" or "In memory 1". Talk naturally and warmly, like an attentive personal mentor who has been following their entire journey closely ("I recall from your resume scan that...", "Since your last Docker quiz score was...").
3. Be actionable, concise, motivating, and sharp. Use markdown with bullet points where appropriate.
4. If the user shares new information about their preferences, goals, or completed tasks (e.g. "I just learned Redis", "Remember that I want to study in the evenings"), acknowledge that you have stored it in your memory vault.
5. At the end of your response, output a structured JSON block delimited by :::SUGGESTIONS::: with 1-2 interactive action chips for the user.
Format:
:::SUGGESTIONS:::
[
  {
    "title": "Action Button Title",
    "description": "Short explanation",
    "actionType": "quiz" | "interview" | "resume" | "chat",
    "actionPayload": { "path": "/quiz", "prompt": "..." }
  }
]
:::SUGGESTIONS:::
`;

    // 3. Build messages array
    const messages = [{ role: "system", content: systemPrompt }];

    // Add recent conversation history (up to last 6 messages)
    const recentHistory = conversationHistory.slice(-6);
    recentHistory.forEach((msg) => {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    });

    messages.push({ role: "user", content: userMessage });

    // 4. Call Groq
    const chatCompletion = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages,
      temperature: 0.7,
      max_tokens: 1200,
    });

    const fullResponse = chatCompletion.choices[0]?.message?.content || "";

    // 5. Parse out action suggestions if present
    let assistantMessage = fullResponse;
    let extractedSuggestions = [];

    if (fullResponse.includes(":::SUGGESTIONS:::")) {
      const parts = fullResponse.split(":::SUGGESTIONS:::");
      assistantMessage = parts[0].trim();
      const suggestionsText = parts[1]?.trim();
      if (suggestionsText) {
        try {
          // Remove potential code block formatting
          const cleanJson = suggestionsText.replace(/```json|```/g, "").trim();
          extractedSuggestions = JSON.parse(cleanJson);
        } catch (e) {
          console.error("Failed to parse extracted suggestions JSON:", e);
        }
      }
    }

    // 6. Check if user provided explicit new facts to remember ("Remember that...", "I prefer...", "My goal is...")
    const lowerQuery = userMessage.toLowerCase();
    if (
      lowerQuery.startsWith("remember") ||
      lowerQuery.includes("remember that") ||
      lowerQuery.includes("my target is") ||
      lowerQuery.includes("i prefer") ||
      lowerQuery.includes("i just learned")
    ) {
      // Auto-save this as a user preference / conversation note memory
      try {
        await createMemory({
          userId,
          category: lowerQuery.includes("goal") ? "career_goal" : "user_preference",
          title: "User Stated Fact / Preference",
          content: userMessage,
          tags: ["user-stated", "preference"],
          importance: 7,
          source: "chat",
        });
      } catch (memErr) {
        console.error("Error auto-recording user fact:", memErr);
      }
    }

    return {
      reply: assistantMessage,
      retrievedMemories: userMemories.map((m) => ({
        memoryId: m._id,
        title: m.title,
        category: m.category,
      })),
      suggestions: extractedSuggestions,
    };
  } catch (error) {
    console.error("Tess Chat Service Error:", error);
    throw error;
  }
}
