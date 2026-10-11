import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'amber' | 'emerald' | 'rose' | 'navy';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}) => {
  let iconBg = 'bg-slate-100 text-slate-700';
  let cardBorder = 'border-slate-200';

  if (variant === 'amber') {
    iconBg = 'bg-amber-100 text-amber-700';
    cardBorder = 'border-amber-200/80';
  } else if (variant === 'emerald') {
    iconBg = 'bg-emerald-100 text-emerald-700';
    cardBorder = 'border-emerald-200/80';
  } else if (variant === 'rose') {
    iconBg = 'bg-rose-100 text-rose-700';
    cardBorder = 'border-rose-200/80';
  } else if (variant === 'navy') {
    iconBg = 'bg-navy-800 text-white';
    cardBorder = 'border-navy-300';
  }

  return (
    <div className={`bg-white rounded-xl border ${cardBorder} p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${iconBg} shadow-inner`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
