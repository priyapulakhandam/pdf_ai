"use client";

interface ProgressRingProps {
  progress?: number;
  indeterminate?: boolean;
  size?: number;
}

export function ProgressRing({ progress = 0, indeterminate, size = 40 }: ProgressRingProps) {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#0e86e9"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={indeterminate ? circumference * 0.25 : offset}
        className={indeterminate ? "animate-spin origin-center" : "transition-all duration-500"}
        style={{ transformOrigin: "center" }}
      />
    </svg>
  );
}
