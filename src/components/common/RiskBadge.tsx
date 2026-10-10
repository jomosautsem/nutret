import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  if (level === 'HIGH_RISK') {
    return (
      <span
        id="risk-badge-high"
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
        🔴 Alto Riesgo
      </span>
    );
  }

  if (level === 'MEDIUM_RISK') {
    return (
      <span
        id="risk-badge-medium"
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        🟡 Riesgo Medio
      </span>
    );
  }

  return (
    <span
      id="risk-badge-normal"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      🟢 Normal
    </span>
  );
};
