import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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

Generate an objective ATS analysis response matching the exact schema specified. Keep matching and missing keywords highly accurate to the text provided. Recommendations should be clear, professional, and actionable.`;

    const response = await ai.models.generateContent({
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
          },
          required: ["matchScore", "matchedKeywords", "missingKeywords", "suggestions", "summary"],
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
