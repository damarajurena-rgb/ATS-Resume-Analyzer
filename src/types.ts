export interface AnalysisResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvedResume: string;
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: string;
  resumePreview: string;
  jobTitlePreview: string;
  result: AnalysisResult;
}
