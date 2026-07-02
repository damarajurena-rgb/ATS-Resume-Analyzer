import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface CircularProgressProps {
  score: number;
}

export default function CircularProgress({ score }: CircularProgressProps) {
  // Clamp score between 0 and 100
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  
  // SVG Ring calculations
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // State for counting up the display score
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = normalizedScore;
    if (start === end) {
      setDisplayScore(end);
      return;
    }
    const duration = 1200; // ms
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [normalizedScore]);

  // Determine color theme based on score
  let strokeColor = "stroke-emerald-500";
  let textColor = "text-emerald-600";
  let bgColor = "bg-emerald-50";
  let glowClass = "glow-emerald";
  let badgeText = "Excellent Match";
  let description = "Strong alignment with core requirements";

  if (normalizedScore < 50) {
    strokeColor = "stroke-rose-500";
    textColor = "text-rose-600";
    bgColor = "bg-rose-50";
    glowClass = "glow-rose";
    badgeText = "Low Match";
    description = "Significant skill & keyword gaps";
  } else if (normalizedScore <= 75) {
    strokeColor = "stroke-amber-500";
    textColor = "text-amber-600";
    bgColor = "bg-amber-50";
    glowClass = "glow-amber";
    badgeText = "Moderate Match";
    description = "Good fit, but needs optimization";
  }

  return (
    <div 
      id="match-score-card" 
      className="flex flex-col items-center p-6 bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/15 transition-all duration-300"
    >
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">ATS Match Score</h3>
      
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg className="absolute transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-100/80 fill-none"
            strokeWidth={strokeWidth}
          />
        </svg>

        {/* Animated Fill Circle with dynamic color glow */}
        <svg className={`absolute transform -rotate-90 ${glowClass}`} width={size} height={size}>
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`fill-none ${strokeColor} transition-colors duration-500`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (normalizedScore / 100) * circumference }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Score text inside with scale motion */}
        <div className="text-center z-10">
          <motion.span 
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            className={`text-5xl font-extrabold tracking-tight ${textColor}`}
          >
            {displayScore}
          </motion.span>
          <span className="text-slate-400 block text-xs font-bold mt-0.5">/ 100</span>
        </div>
      </div>

      <div className="mt-5 text-center">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${bgColor} ${textColor} border border-current/10 mb-1.5`}>
          {badgeText}
        </span>
        <p className="text-xs text-slate-500 font-medium max-w-[180px]">
          {description}
        </p>
      </div>
    </div>
  );
}
