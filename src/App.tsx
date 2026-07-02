import { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Briefcase, 
  Sparkles, 
  RefreshCcw, 
  AlertCircle, 
  Copy, 
  Check, 
  Download, 
  Info, 
  Cpu,
  BookmarkCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { AnalysisResult, AnalysisHistoryItem } from "./types";
import { SAMPLE_RESUME, SAMPLE_JOB_DESCRIPTION } from "./constants";
import CircularProgress from "./components/CircularProgress";
import KeywordTags from "./components/KeywordTags";
import SuggestionsList from "./components/SuggestionsList";
import HistoryPanel from "./components/HistoryPanel";

export default function App() {
  // Input form states
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  // Validation and process states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Active analysis results
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);

  // Copy/export feedback states
  const [copiedSummary, setCopiedSummary] = useState(false);
  
  // Local storage history
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);

  // Ref to automatically scroll to results
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ats_analysis_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
      }
    }
  }, []);

  // Save history helper
  const saveHistory = (updated: AnalysisHistoryItem[]) => {
    setHistory(updated);
    localStorage.setItem("ats_analysis_history", JSON.stringify(updated));
  };

  // Pre-load sample data
  const handleLoadSample = () => {
    setResumeText(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
    setValidationError(null);
    setErrorMsg(null);
  };

  // Clear inputs and current results
  const handleReset = () => {
    setResumeText("");
    setJobDescription("");
    setValidationError(null);
    setErrorMsg(null);
    setResult(null);
    setActiveAnalysisId(null);
  };

  // Main analyze operation
  const handleAnalyze = async () => {
    setValidationError(null);
    setErrorMsg(null);

    // Validation checks
    if (!resumeText.trim()) {
      setValidationError("Please paste your resume text to begin analysis.");
      return;
    }
    if (!jobDescription.trim()) {
      setValidationError("Please paste the job description to match against.");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

      // Create a snapshot item for history
      const firstLineResume = resumeText.trim().split("\n")[0] || "Untitled CV";
      const cleanedResumeTitle = firstLineResume.replace(/[^a-zA-Z0-9\s|]/g, "").substring(0, 35);
      
      const firstLineJob = jobDescription.trim().split("\n")[0] || "Untitled Job";
      const cleanedJobTitle = firstLineJob.replace(/[^a-zA-Z0-9\s|]/g, "").substring(0, 35);

      const newItem: AnalysisHistoryItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        resumePreview: cleanedResumeTitle || "Resume Text",
        jobTitlePreview: cleanedJobTitle || "Job Description",
        result: data,
      };

      const newHistory = [newItem, ...history].slice(0, 10); // Keep last 10 entries
      saveHistory(newHistory);
      setActiveAnalysisId(newItem.id);

      // Scroll smoothly to results after brief delay for state render
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Select historical analysis
  const handleSelectHistoryItem = (item: AnalysisHistoryItem) => {
    setResult(item.result);
    setActiveAnalysisId(item.id);
    
    // Auto scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Delete historical analysis
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    saveHistory(updated);
    if (activeAnalysisId === id) {
      setResult(null);
      setActiveAnalysisId(null);
    }
  };

  // Clear all history
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your local analysis history?")) {
      saveHistory([]);
      setResult(null);
      setActiveAnalysisId(null);
    }
  };

  // Copy summary text to clipboard
  const handleCopySummary = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Download simple text report
  const handleDownloadReport = () => {
    if (!result) return;
    
    const reportText = `ATS RESUME MATCH REPORT
=======================
Match Score: ${result.matchScore}/100

SUMMARY ASSESSMENT
------------------
${result.summary}

MATCHED KEYWORDS
----------------
${result.matchedKeywords.length > 0 ? result.matchedKeywords.join(", ") : "None"}

MISSING KEYWORDS
----------------
${result.missingKeywords.length > 0 ? result.missingKeywords.join(", ") : "None"}

SUGGESTIONS TO IMPROVE
----------------------
${result.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}

Generated via ATS Resume Analyzer on ${new Date().toLocaleDateString()}
`;

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ATS_Analysis_Report_${result.matchScore}Percent.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen flex flex-col antialiased text-slate-100 overflow-x-hidden">
      
      {/* Premium Animated 3D Gradient Mesh Background */}
      <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
        {/* Underlay Dark Base Gradient */}
        <div className="absolute inset-0 bg-[#0f172a]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090b16] via-[#0f172a] to-[#1e152d]" />
        
        {/* Soft floating blurred 3D drifting Orbs with depth */}
        <div className="absolute top-[8%] left-[10%] w-[380px] h-[380px] rounded-full bg-indigo-600/15 blur-[100px] animate-orb-1" />
        <div className="absolute bottom-[15%] right-[5%] w-[480px] h-[480px] rounded-full bg-purple-600/15 blur-[120px] animate-orb-2" />
        <div className="absolute top-[45%] left-[60%] w-[320px] h-[320px] rounded-full bg-blue-600/10 blur-[90px] animate-orb-3" />
        
        {/* Grid Overlay with light perspective */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,white,transparent_85%)]" />
      </div>

      {/* Glassmorphic Header Bar */}
      <header className="border-b border-white/10 bg-[#0f172a]/70 backdrop-blur-md sticky top-0 z-30 shadow-lg shadow-slate-950/15">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl text-white shadow-md shadow-indigo-500/25">
              <Cpu className="h-5 w-5 animate-pulse" />
            </span>
            <div>
              <span className="font-extrabold text-white tracking-tight text-base sm:text-lg block">ATS Resume Analyzer</span>
              <span className="text-[9px] text-indigo-300 font-extrabold uppercase tracking-widest block -mt-1">Enterprise Grade Matcher</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadSample}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 shadow-sm"
            >
              Load Sample Data
            </button>
            <button
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              Reset Fields
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-10 z-10">
        
        {/* Landing Hero Area */}
        <section className="text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full text-xs font-extrabold border border-indigo-500/25 mb-4 uppercase tracking-widest">
              <Sparkles className="h-3 w-3" /> Resume Optimizer
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-slate-200 mb-4 font-sans">
              Optimize Your Resume for ATS Search Filters
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Find exactly what recruiters are looking for. Compare your qualifications with specific job requirements using our advanced ATS scanner, and receive missing keywords instantly.
            </p>
          </motion.div>
        </section>

        {/* Validation and Error Alerts */}
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 p-4.5 bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 text-amber-200 rounded-2xl flex items-start gap-3 shadow-lg shadow-amber-950/10"
            >
              <AlertCircle className="h-5 w-5 mt-0.5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Validation Notice</p>
                <p className="text-xs text-amber-300/90 mt-0.5">{validationError}</p>
              </div>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 p-4.5 bg-rose-500/10 backdrop-blur-xl border border-rose-500/30 text-rose-200 rounded-2xl flex items-start gap-3 shadow-lg shadow-rose-950/10"
            >
              <AlertCircle className="h-5 w-5 mt-0.5 text-rose-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">An Error Occurred</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{errorMsg}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Panel */}
        <HistoryPanel 
          history={history}
          onSelect={handleSelectHistoryItem}
          onDelete={handleDeleteHistoryItem}
          onClearAll={handleClearHistory}
          activeId={activeAnalysisId}
        />

        {/* Form Inputs Block */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Resume Block */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-5 sm:p-6 shadow-xl shadow-slate-900/10 flex flex-col h-[430px] hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shadow-sm">
                <FileText className="h-4.5 w-4.5" />
              </span>
              <div>
                <label htmlFor="resume-text" className="font-extrabold text-slate-900 text-sm">Paste Your Resume Text</label>
                <span className="text-[10px] text-slate-400 block -mt-0.5 font-bold">Copy/paste your current resume content</span>
              </div>
            </div>
            
            <textarea
              id="resume-text"
              className="flex-grow w-full border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none bg-slate-50/50 text-slate-900 placeholder-slate-400 font-medium"
              placeholder="Paste details of your background, experience, technical skills, and education here..."
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (validationError) setValidationError(null);
              }}
            />
            <div className="flex justify-between items-center mt-3 text-[10px] text-slate-400 font-bold">
              <span>Plain text paste</span>
              <span>{resumeText.length > 0 ? `${resumeText.split(/\s+/).filter(Boolean).length} words` : "0 words"}</span>
            </div>
          </div>

          {/* Job Requirements Block */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-5 sm:p-6 shadow-xl shadow-slate-900/10 flex flex-col h-[430px] hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shadow-sm">
                <Briefcase className="h-4.5 w-4.5" />
              </span>
              <div>
                <label htmlFor="job-description" className="font-extrabold text-slate-900 text-sm">Paste Job Description</label>
                <span className="text-[10px] text-slate-400 block -mt-0.5 font-bold">Copy/paste targets from job posting</span>
              </div>
            </div>

            <textarea
              id="job-description"
              className="flex-grow w-full border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none bg-slate-50/50 text-slate-900 placeholder-slate-400 font-medium"
              placeholder="Paste key responsibilities, required qualification criteria, tools, and job criteria..."
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                if (validationError) setValidationError(null);
              }}
            />
            <div className="flex justify-between items-center mt-3 text-[10px] text-slate-400 font-bold">
              <span>Paste requirements</span>
              <span>{jobDescription.length > 0 ? `${jobDescription.split(/\s+/).filter(Boolean).length} words` : "0 words"}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-14">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`hover-depth-btn px-10 py-4 rounded-xl font-extrabold text-white shadow-lg transition-all flex items-center gap-3 text-base cursor-pointer ${
              isAnalyzing 
                ? "bg-indigo-400/80 cursor-not-allowed" 
                : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600"
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCcw className="h-5 w-5 animate-spin" />
                <span>Scanning Match compatibility...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Analyze Match Compatibility</span>
              </>
            )}
          </button>
        </div>

        {/* Loading Skeleton */}
        {isAnalyzing && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-xl shadow-slate-900/10 text-center max-w-xl mx-auto flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-600 font-extrabold text-xs">ATS</div>
            </div>
            
            <h3 className="font-extrabold text-slate-900 text-lg mb-2">Analyzing Resume & Skill Fit</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed font-medium">
              We are parsing your resume text and job description matching structural keyword requirements.
            </p>
            
            <div className="flex items-center gap-2 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-100/50 text-indigo-700 font-bold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              <span>Matching core qualifications...</span>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        <div ref={resultsRef} className="scroll-mt-20">
          {result && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-6 text-slate-900"
            >
              {/* Overall Score Header Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Score Circle Gauge */}
                <div className="md:col-span-1">
                  <CircularProgress score={result.matchScore} />
                </div>

                {/* 2. Frosted Summary Panel */}
                <div className="md:col-span-2 bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-xl shadow-slate-900/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shadow-sm">
                          <BookmarkCheck className="h-4.5 w-4.5" />
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm">Overall Assessment Summary</h3>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopySummary}
                          className="p-1.5 hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-850 flex items-center gap-1 text-[10px] font-extrabold transition-all"
                          title="Copy assessment summary"
                        >
                          {copiedSummary ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedSummary ? "Copied" : "Copy Summary"}
                        </button>
                        
                        <button
                          onClick={handleDownloadReport}
                          className="p-1.5 hover:bg-indigo-50 rounded-xl border border-indigo-100/40 text-indigo-600 flex items-center gap-1 text-[10px] font-extrabold transition-all"
                          title="Download summary report"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download Report</span>
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-slate-800 text-sm leading-relaxed font-semibold bg-slate-50/50 p-4 rounded-xl border border-slate-100 italic">
                      "{result.summary}"
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Info className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span>The standard passing ATS recommendation score is 70% or more. Incorporate the missing keywords to maximize candidate compatibility.</span>
                  </div>
                </div>

              </div>

              {/* Matched vs Missing Keywords Columns */}
              <KeywordTags 
                matchedKeywords={result.matchedKeywords}
                missingKeywords={result.missingKeywords}
              />

              {/* Suggestions Panel */}
              <SuggestionsList 
                suggestions={result.suggestions}
              />
            </motion.div>
          )}
        </div>

      </main>

      {/* Modern Premium Footer */}
      <footer className="bg-slate-950/40 border-t border-white/5 mt-24 py-10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 ATS Resume Analyzer. All processing completes locally and securely using Google Gemini AI.</p>
          <div className="flex gap-6 font-bold">
            <span className="hover:text-white transition-colors cursor-default">Privacy Guaranteed</span>
            <span className="hover:text-white transition-colors cursor-default">Direct Match Parsing</span>
            <span className="hover:text-white transition-colors cursor-default">Local Persistence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
