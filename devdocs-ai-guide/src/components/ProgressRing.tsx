import React from 'react';

export interface ProgressRingProps {
  value: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ value }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg
      role="progressbar"
      aria-label="Curriculum progress"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${value}% completed`}
      className="w-12 h-12 transform -rotate-90"
      viewBox="0 0 120 120"
    >
      <circle
        className="text-secondary"
        strokeWidth="10"
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx="60"
        cy="60"
      />
      <circle
        className="text-primary"
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx="60"
        cy="60"
        style={{ transition: 'stroke-dashoffset 0.3s' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        className="text-lg font-semibold fill-current text-foreground transform rotate-90 origin-center"
      >
        {`${value}%`}
      </text>
    </svg>
  );
};

export default ProgressRing;
