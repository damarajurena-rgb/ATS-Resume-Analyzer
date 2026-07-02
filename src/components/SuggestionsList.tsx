import { Lightbulb, Sparkles } from "lucide-react";
import { useState } from "react";

interface SuggestionsListProps {
  suggestions: string[];
}

export default function SuggestionsList({ suggestions }: SuggestionsListProps) {
  // Allow user to tick off recommendations as they apply them
  const [completedList, setCompletedList] = useState<Record<number, boolean>>({});

  const toggleComplete = (index: number) => {
    setCompletedList(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div id="suggestions-card" className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-xl shadow-slate-900/10">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
          <Lightbulb className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-extrabold text-slate-950">Step-by-Step Optimization Suggestions</h3>
          <p className="text-xs text-slate-500 font-medium">Actionable modifications to boost your match rating</p>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.length === 0 ? (
          <div className="text-center p-6 text-slate-400 font-medium text-xs">
            No suggestions required. Your resume fully matches this job description!
          </div>
        ) : (
          suggestions.map((suggestion, index) => {
            const isCompleted = !!completedList[index];
            return (
              <div
                key={index}
                onClick={() => toggleComplete(index)}
                className={`flex gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  isCompleted
                    ? "bg-slate-50/50 border-slate-200 text-slate-400"
                    : "bg-indigo-50/10 border-indigo-50/50 hover:border-indigo-200 hover:bg-indigo-50/20 text-slate-700"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => {}} // toggled via parent div click
                    className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
                
                <div className="flex-grow">
                  <p className={`text-sm leading-relaxed ${isCompleted ? "line-through text-slate-400" : "font-semibold"}`}>
                    {suggestion}
                  </p>
                </div>
                
                {!isCompleted && (
                  <div className="flex-shrink-0 self-center">
                    <Sparkles className="h-4 w-4 text-indigo-400/80" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex items-center justify-between bg-slate-50/70 px-4 py-2.5 rounded-xl border border-slate-100">
        <span className="text-xs text-slate-500 font-bold">
          Progress Tracker
        </span>
        <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/30">
          {Object.values(completedList).filter(Boolean).length} of {suggestions.length} Completed
        </span>
      </div>
    </div>
  );
}
