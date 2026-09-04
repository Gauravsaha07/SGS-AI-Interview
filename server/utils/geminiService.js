import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.warn("GEMINI_API_KEY is not configured or using default fallback placeholder.");
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  // Always use Google's fast, low-latency Flash-Lite model alias
  return genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
};

/**
 * Helper to determine if a Gemini API error is transient/retryable.
 * Retryable: HTTP 503 (Service Unavailable), HTTP 429 (Rate Limit / High Demand),
 * 500, 502, 504, and network timeouts / socket / connection errors.
 * Non-retryable: HTTP 404 (Model Not Found), 401/403 (Auth/Key error), 400 (Bad Request).
 */
const isTransientError = (error) => {
  if (!error) return false;

  const status =
    error.status ||
    error.statusCode ||
    error.response?.status ||
    error.statusDetails?.code;

  // Non-retryable status codes: 400, 401, 403, 404
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return false;
  }

  // Retryable status codes: 503, 429, 500, 502, 504
  if (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 504
  ) {
    return true;
  }

  const message = String(error.message || "").toLowerCase();

  // Check for non-transient keywords in error message
  if (
    message.includes("404") ||
    message.includes("401") ||
    message.includes("403") ||
    message.includes("400") ||
    message.includes("not found") ||
    message.includes("api_key_invalid") ||
    message.includes("invalid api key") ||
    message.includes("unauthorized") ||
    message.includes("permission denied")
  ) {
    return false;
  }

  // Check for transient keywords in error message
  if (
    message.includes("503") ||
    message.includes("429") ||
    message.includes("service unavailable") ||
    message.includes("too many requests") ||
    message.includes("high demand") ||
    message.includes("spikes in demand") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted") ||
    message.includes("quota") ||
    message.includes("overloaded") ||
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("socket hang up") ||
    message.includes("network error") ||
    message.includes("timeout") ||
    message.includes("temporarily unavailable")
  ) {
    return true;
  }

  return false;
};

/**
 * Wraps any Gemini API call with exponential backoff retry logic.
 * Retries up to 3 total attempts for transient errors (503, 429, network timeouts).
 * Attempt 1: immediate
 * Attempt 2: after 1000ms
 * Attempt 3: after 2000ms
 */
export const callGeminiWithRetry = async (fn, maxAttempts = 3) => {
  const delays = [1000, 2000]; // Delays before attempt 2 and 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isTransient = isTransientError(error);

      if (!isTransient || attempt >= maxAttempts) {
        throw error;
      }

      const delayMs = delays[attempt - 1] || 2000;
      const statusText =
        error.status ||
        error.statusCode ||
        (error.message && error.message.includes("503")
          ? "503 Service Unavailable"
          : error.message && error.message.includes("429")
          ? "429 Too Many Requests"
          : "Transient Error");

      console.warn(
        `[Gemini Retry] Attempt ${attempt}/${maxAttempts} failed after ${statusText}, retrying in ${delayMs / 1000}s...`
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

/**
 * Generate dynamic, role-specific, difficulty-accurate interview questions
 */
export const generateInterviewQuestions = async ({
  jobField,
  jobTitle,
  experienceLevel,
  difficulty,
  interviewType,
  qualification,
}) => {
  const model = getGeminiModel();

  const sessionSeed = Math.random().toString(36).substring(7) + "_" + Date.now();

  const prompt = `
You are an expert HR and Technical Interviewer conducting a realistic job interview.
Generate EXACTLY 8 to 10 highly specific, authentic, sequential interview questions for a candidate with the following profile:

- Target Job Field / Sector: ${jobField}
- Specific Job Title / Role: ${jobTitle}
- Candidate Experience Level: ${experienceLevel}
- Desired Question Difficulty: ${difficulty}
- Interview Setting / Type: ${interviewType}
- Candidate Educational Qualification: ${qualification}
- Session Unique ID: ${sessionSeed}

CRITICAL RULES FOR QUESTION GENERATION:
1. NO FIXED OR REPETITIVE SENTENCE TEMPLATES. Do NOT use generic string-substitutions like "Tell us about yourself and why your background in X makes you a good fit for this Y role". Every single question MUST be an authentic, role-specific technical or domain question tailored to a ${jobTitle}.
2. ROLE-SPECIFIC TECHNICAL/DOMAIN KNOWLEDGE:
   - For Technical / Software / Engineering roles (e.g. Full Stack Developer, Data Engineer): ask real technical concepts (e.g. scoping, async behavior, database indexing, state management, system design). Start Question 1 by asking about their primary tech stack and tools.
   - For Medical / Healthcare roles (e.g. Doctor, Nurse): ask clinical protocols, diagnostic procedures, patient management, or medical ethics.
   - For Management / Business roles: ask operational strategy, KPI tracking, conflict resolution, or resource allocation.
   - For any other field: ask authentic domain questions that a real interviewer in that field would ask.
3. DIFFICULTY ACCURACY (FROM QUESTION 1 ONWARD):
   - Easy: Core fundamental concepts and basic principles for ${jobTitle} starting right from Question 1.
   - Medium: Intermediate practical scenarios, hands-on troubleshooting, and real-world implementation for ${jobTitle} starting right from Question 1 (do NOT start with basic syntax).
   - Hard: Advanced architecture, edge cases, high-stakes crisis scenarios, and complex system tradeoffs for ${jobTitle} starting right from Question 1.
4. VARIETY ACROSS SESSIONS:
   - Use the Unique ID (${sessionSeed}) to generate fresh, unique questions. Do not generate identical questions across sessions.
5. Minimum 8 questions required.

Return ONLY a valid JSON array of question strings without markdown formatting, e.g.:
["Question 1 text...", "Question 2 text...", "Question 3 text...", "Question 4 text...", "Question 5 text...", "Question 6 text...", "Question 7 text...", "Question 8 text..."]
`;

  if (!model) {
    // Realistic fallback domain questions per field if API key is unconfigured
    return [
      `What primary programming languages, frameworks, or domain tools do you use daily as a ${jobTitle}?`,
      `How do you handle error handling, logging, and debugging in a production ${interviewType} environment for ${jobTitle}?`,
      `Describe a complex technical or operational challenge you solved as a ${experienceLevel} ${jobTitle}.`,
      `How do you ensure data integrity, security, and compliance when working in ${jobField}?`,
      `What is your approach to code/process reviews and maintaining high quality standards?`,
      `Explain how you optimize performance and handle bottleneck issues in your work as ${jobTitle}.`,
      `How do you collaborate with cross-functional teams and handle conflicting technical requirements?`,
      `What recent trends or advancements in ${jobField} are you currently integrating into your workflow?`,
    ];
  }

  try {
    const result = await callGeminiWithRetry(() => model.generateContent(prompt));
    const text = result.response.text();
    const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const questions = JSON.parse(cleanText);

    if (Array.isArray(questions) && questions.length >= 8) {
      return questions;
    } else if (Array.isArray(questions) && questions.length > 0) {
      while (questions.length < 8) {
        questions.push(`Follow-up question ${questions.length + 1} regarding specialized practices in ${jobTitle}.`);
      }
      return questions;
    }
  } catch (error) {
    console.error("[Gemini Question Generation] Failed:", error);
    throw new Error(`[Gemini Question Generation] Failed: ${error.message}`);
  }

  return [
    `What primary tools, frameworks, or domain methodologies do you use daily as a ${jobTitle}?`,
    `How do you approach troubleshooting and root-cause analysis in a ${difficulty}-level ${interviewType} setting?`,
    `Describe a major project or technical challenge you delivered as a ${experienceLevel} ${jobTitle}.`,
    `How do you ensure safety, security, and quality compliance in ${jobField}?`,
    `What strategies do you use for performance optimization in ${jobTitle}?`,
    `Walk us through how you handle unexpected system failures or high-pressure situations.`,
    `How do you evaluate tradeoffs when choosing between competing solutions in ${jobTitle}?`,
    `Where do you see domain standards evolving in ${jobField} over the next 3 years?`,
  ];
};

/**
 * Review candidate answer to a single question
 */
export const reviewAnswer = async ({
  jobField,
  jobTitle,
  question,
  candidateAnswer,
  nextQuestionOriginal,
}) => {
  const model = getGeminiModel();

  const prompt = `
You are an expert, professional, and encouraging interviewer for a ${jobTitle} position in ${jobField}.

Question Asked: "${question}"
Candidate's Answer: "${candidateAnswer}"
Original Next Planned Question: "${nextQuestionOriginal || ""}"

EVALUATION & INTERVIEWER TONE INSTRUCTIONS:
1. Assess the candidate's answer for technical/domain accuracy, completeness, and clarity.
2. IF THE CANDIDATE'S ANSWER IS WRONG, INCOMPLETE, OR SAYS "I DON'T KNOW" / "NOT SURE":
   - Acknowledge it politely and warmly (e.g., "No worries!", "That's okay!", or "Good effort!").
   - Provide the complete, accurate technical or domain explanation directly.
   - Explain what key concepts were missing.
3. IF THE CANDIDATE'S ANSWER IS GOOD OR CORRECT:
   - Affirm it warmly and enthusiastically (e.g., "Great job! That's spot on.", "Excellent explanation!").
4. ADAPTIVE FOLLOW-UP: If an original next question is provided ("${nextQuestionOriginal}"), refine or adapt it to seamlessly follow up on what the candidate just answered (e.g. if candidate mentioned a specific tool/language, probe into that).
5. Assign a score from 0 to 100 based on domain accuracy.

Return ONLY a valid JSON object with this exact structure:
{
  "strengths": "Praise key strengths or acknowledge effort warmly",
  "missing": "Clear explanation of missing points or what was incorrect",
  "betterAnswer": "The full, professional, correct answer",
  "score": <number 0-100>,
  "adaptedNextQuestion": "Refined next question string (or original if no adaptation needed)"
}
`;

  if (!model) {
    const wordCount = candidateAnswer.trim().split(/\s+/).length;
    const fallbackScore = Math.min(100, Math.max(45, wordCount * 4 + 40));
    return {
      strengths: "Good effort in providing a direct answer to the question.",
      missing: "Consider adding specific domain metrics and practical examples.",
      betterAnswer: `A comprehensive answer for ${jobTitle} should detail specific methodologies and structured problem-solving steps.`,
      rawText: "Answer evaluated.",
      score: fallbackScore,
      adaptedNextQuestion: nextQuestionOriginal || "",
    };
  }

  try {
    const result = await callGeminiWithRetry(() => model.generateContent(prompt));
    const text = result.response.text();
    const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanText);

    return {
      strengths: parsed.strengths || "Good clarity in your explanation.",
      missing: parsed.missing || "Could include deeper technical context.",
      betterAnswer: parsed.betterAnswer || "Elaborate using structured domain frameworks.",
      rawText: text,
      score: typeof parsed.score === "number" ? parsed.score : 75,
      adaptedNextQuestion: parsed.adaptedNextQuestion || nextQuestionOriginal || "",
    };
  } catch (error) {
    console.error("[Gemini Answer Review] Failed:", error);
    return {
      strengths: "Good attempt at addressing the core prompt.",
      missing: "Expand on specific technical details and domain practices.",
      betterAnswer: "Provide a structured explanation with concrete examples.",
      rawText: "Answer evaluated.",
      score: 70,
      adaptedNextQuestion: nextQuestionOriginal || "",
    };
  }
};

/**
 * Calculate final overall composite score and summary feedback
 */
export const calculateCompositeScore = async (questions) => {
  const answeredQuestions = questions.filter(
    (q) => q.candidateAnswer && q.candidateAnswer.trim() !== ""
  );

  if (answeredQuestions.length === 0) {
    return { overallScore: 0, overallFeedback: "No questions answered." };
  }

  const scores = answeredQuestions.map((q) => q.aiReview?.score || 70);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  let feedback = "";
  if (avgScore >= 85) {
    feedback = "Exceptional interview performance! Demonstrates deep domain knowledge, clear communication, and strong problem-solving skills.";
  } else if (avgScore >= 70) {
    feedback = "Solid performance overall. Good fundamental understanding with minor opportunities to provide structured metrics and deeper technical details.";
  } else {
    feedback = "Satisfactory effort. Focus on practicing structured answers (STAR method) and mastering core concepts relevant to the target role.";
  }

  return {
    overallScore: avgScore,
    overallFeedback: feedback,
  };
};

/**
 * Admin AI Assistant real conversational agent with live DB context
 */
export const askAdminAssistant = async ({ prompt, liveStats }) => {
  const model = getGeminiModel();

  const statsContext = `
Real-time Platform Metrics (from MongoDB):
- Total Registered Users: ${liveStats.totalUsers} (Candidates: ${liveStats.totalCandidates}, Admins: ${liveStats.totalAdmins})
- Total Interviews Conducted: ${liveStats.totalInterviews} (Completed: ${liveStats.completedInterviews}, In-Progress: ${liveStats.inProgressInterviews})
- Total Credit Requests: ${liveStats.totalCreditRequests} (Pending: ${liveStats.pendingCreditRequests}, Approved: ${liveStats.approvedCreditRequests}, Rejected: ${liveStats.rejectedCreditRequests})
- Total Credits Distributed / Purchased: ${liveStats.totalCreditsDistributed || 0}
`;

  if (!model) {
    return `[SGS Admin AI Assistant]\nI received your query: "${prompt}".\nLive System Metrics: ${liveStats.totalUsers} total users, ${liveStats.totalInterviews} interviews, ${liveStats.pendingCreditRequests} pending credit requests. How can I help you further?`;
  }

  try {
    const fullPrompt = `
You are the intelligent, helpful SGS AI Platform Admin Assistant engaging in a natural, conversational chat with the system administrator.

ADMIN MESSAGE: "${prompt}"

REAL-TIME MONGO DB METRICS CONTEXT:
${statsContext}

INSTRUCTIONS FOR YOUR RESPONSE:
1. Respond DIRECTLY and NATURALLY to whatever the admin typed in their message ("${prompt}").
   - If the admin says "hello", "hi", "how are you?", or asks a general question, reply conversationally and warmly like a friendly AI assistant. Do NOT dump database statistics if the user didn't ask for them!
   - If the admin asks about platform data, metrics, users, interviews, credit requests, or system status (e.g. "how many users do we have?", "what is the pending queue?", "summarize system performance"), USE the exact live MongoDB numbers provided above to give an accurate, grounded answer.
2. Never invent or hallucinate metrics when answering data questions.
3. Keep your response helpful, concise, and nicely formatted in Markdown.
`;

    const result = await callGeminiWithRetry(() => model.generateContent(fullPrompt));
    return result.response.text();
  } catch (error) {
    console.error("[Gemini Admin Assistant] Failed:", error);
    return `Hello! I received your message "${prompt}". Current live platform status:\n- Total Users: ${liveStats.totalUsers}\n- Total Interviews: ${liveStats.totalInterviews}\n- Pending Credit Requests: ${liveStats.pendingCreditRequests}`;
  }
};
