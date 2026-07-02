import { CheckCircle2, AlertTriangle, Search } from "lucide-react";
import { useState } from "react";

interface KeywordTagsProps {
  matchedKeywords: string[];
  missingKeywords: string[];
}

export default function KeywordTags({ matchedKeywords, missingKeywords }: KeywordTagsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMatched = matchedKeywords.filter(kw => 
    kw.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMissing = missingKeywords.filter(kw => 
    kw.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="keywords-analysis-section" className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-xl shadow-slate-900/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-950">Keyword & Skill Gap Analysis</h3>
          <p className="text-xs text-slate-500 font-medium">Compare identified keywords in the resume against job requirements</p>
        </div>
        
        {/* Search Filter bar */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50 text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Matched Keywords Column */}
        <div id="matched-keywords-col" className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <span className="font-bold text-slate-800 text-sm">Matched Keywords</span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100/35">
              {filteredMatched.length} of {matchedKeywords.length}
            </span>
          </div>

          {matchedKeywords.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-400 text-center">No matching keywords identified.</p>
            </div>
          ) : filteredMatched.length === 0 ? (
            <div className="p-4 bg-slate-50/50 rounded-xl text-center">
              <p className="text-xs text-slate-400">No matching search results.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 content-start bg-emerald-50/25 p-4 rounded-xl border border-emerald-100/30 min-h-[140px]">
              {filteredMatched.map((keyword, index) => (
                <span
                  key={index}
                  className="hover-depth-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100 shadow-sm shadow-emerald-900/5 cursor-default"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Missing Keywords Column */}
        <div id="missing-keywords-col" className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <span className="font-bold text-slate-800 text-sm">Missing Keywords</span>
            </div>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-100/35">
              {filteredMissing.length} of {missingKeywords.length}
            </span>
          </div>

          {missingKeywords.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-emerald-50/20 rounded-xl border border-dashed border-emerald-200">
              <p className="text-xs text-emerald-700 font-bold text-center">Perfect! No key terms are missing.</p>
            </div>
          ) : filteredMissing.length === 0 ? (
            <div className="p-4 bg-slate-50/50 rounded-xl text-center">
              <p className="text-xs text-slate-400">No matching search results.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 content-start bg-rose-50/25 p-4 rounded-xl border border-rose-100/30 min-h-[140px]">
              {filteredMissing.map((keyword, index) => (
                <span
                  key={index}
                  className="hover-depth-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-100 shadow-sm shadow-rose-900/5 cursor-default"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
