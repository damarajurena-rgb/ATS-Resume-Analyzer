import { History, Trash2, Calendar } from "lucide-react";
import { AnalysisHistoryItem } from "../types";

interface HistoryPanelProps {
  history: AnalysisHistoryItem[];
  onSelect: (item: AnalysisHistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  activeId: string | null;
}

export default function HistoryPanel({ 
  history, 
  onSelect, 
  onDelete, 
  onClearAll, 
  activeId 
}: HistoryPanelProps) {
  if (history.length === 0) return null;

  return (
    <div id="history-section" className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-xl shadow-slate-900/10 mb-8">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-slate-50 text-slate-600 rounded-lg">
            <History className="h-4 w-4" />
          </span>
          <h3 className="font-extrabold text-slate-950 text-sm">Recent Analyses</h3>
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline flex items-center gap-1 transition-all"
        >
          <Trash2 className="h-3 w-3" /> Clear History
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[250px] overflow-y-auto pr-1">
        {history.map((item) => {
          const isActive = activeId === item.id;
          const score = item.result.matchScore;
          
          let scoreBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100/40";
          if (score < 50) {
            scoreBadgeColor = "bg-rose-50 text-rose-700 border-rose-100/40";
          } else if (score <= 75) {
            scoreBadgeColor = "bg-amber-50 text-amber-700 border-amber-100/40";
          }

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={`group flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                isActive
                  ? "bg-indigo-50/40 border-indigo-500 shadow-sm"
                  : "bg-slate-50/50 border-slate-100 hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-bold">
                  <Calendar className="h-3 w-3" />
                  <span>{item.timestamp}</span>
                </div>
                
                <p className="text-xs font-bold text-slate-800 truncate mb-0.5">
                  Resume: {item.resumePreview}
                </p>
                <p className="text-xs text-slate-500 truncate font-medium">
                  Job: {item.jobTitlePreview}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`px-2 py-0.5 text-xs font-bold border rounded-lg ${scoreBadgeColor}`}>
                  {score}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete analysis"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
