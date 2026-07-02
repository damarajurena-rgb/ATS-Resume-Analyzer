import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini SDK client with key verification
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in your Settings menu.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for ATS Resume Analysis
app.post("/api/analyze", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ error: "Resume text is required." });
    }
    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ error: "Job description is required." });
    }

    const prompt = `You are an expert ATS (Applicant Tracking System) recruiter. Analyze the following resume text against the job description text and assess the match.

Resume Text:
"""
${resumeText}
"""

Job Description:
"""
${jobDescription}
"""

Generate an objective ATS analysis response matching the exact schema specified. 
Keep matching and missing keywords highly accurate to the text provided. 
Recommendations should be clear, professional, and actionable.

For the improved resume ("improvedResume"):
1. Fully rewrite, rephrase, reorganize, and strengthen the language for elements genuinely present in the original resume text.
2. CRITICAL CONSTRAINT: NEVER add any skills, tools, technologies, frameworks, methodologies, languages, or certifications that the candidate did not mention anywhere in their original resume text, even if they appear in the job description as missing keywords.
3. CRITICAL CONSTRAINT: NEVER change or alter the candidate's actual job titles. Job titles must remain exactly as they are in the original resume.
4. Keep the candidate's real experience, company names, dates of employment, and education 100% truthful, factual, and unchanged.
5. CRITICAL VERIFICATION: Cross-check every number, percentage, metric, and named tool or technology in your rewritten output against the original resume text. If it does not appear verbatim or as a direct, clear paraphrase of something in the original, you MUST remove it or rewrite that bullet point without inventing metrics, numbers, or unmentioned technologies. Do not hallucinate or invent new metrics or numbers.
6. If a skill, keyword, or requirement from the job description is missing, it should appear in "missingKeywords" and "suggestions" only. It MUST NOT be silently added to the improved resume's body, content, or skills list.
7. Use a clean, standard, ATS-friendly plain text format with clear section headers (Summary, Experience, Skills, Education). No tables, no graphics, no columns.`;

    const response = await getAI().models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: {
              type: Type.INTEGER,
              description: "A number from 0 to 100 representing keyword and skill match. Scores should reflect realism based on ATS rules.",
            },
            matchedKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Important keywords, tools, or skills present in both the resume and the job description.",
            },
            missingKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Important keywords, tools, or skills present in the job description but completely missing or underrepresented in the resume.",
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 5 specific, actionable suggestions/bullets to improve the resume's match score against this job description.",
            },
            summary: {
              type: Type.STRING,
              description: "A 2 to 3 sentence professional overall assessment.",
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 5 specific things the resume does well (e.g. strong action verbs, quantified achievements, relevant experience).",
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 5 specific gaps, weaknesses, or formatting issues (e.g. missing metrics, generic phrasing, missing key requirements).",
            },
            improvedResume: {
              type: Type.STRING,
              description: "A fully rewritten, optimized, ATS-friendly plain text version of the resume that rephrases and strengthens language ONLY for elements genuinely present in the original resume. It MUST NOT add any unmentioned skills, tools, job titles, metrics, percentages, or certifications, even if they are in the job description. Do not alter job titles. All numbers and technologies must be cross-checked and present in the original resume.",
            },
          },
          required: [
            "matchScore", 
            "matchedKeywords", 
            "missingKeywords", 
            "suggestions", 
            "summary",
            "strengths",
            "weaknesses",
            "improvedResume"
          ],
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini model.");
    }

    const analysisResult = JSON.parse(text);
    return res.json(analysisResult);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return res.status(500).json({
      error: "An error occurred during resume analysis. " + (error.message || "")
    });
  }
});

// Setup Vite middleware in dev or serve static files in prod
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
