import React from 'react';
import { Lightbulb } from 'lucide-react';

interface InsightCardProps {
  title?: string;
  children: React.ReactNode;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title = 'Insight & cara membaca',
  children,
}) => (
  <aside className="rounded-2xl border border-cyan-500/25 bg-cyan-950/25 p-4 text-xs leading-relaxed text-slate-200">
    <h4 className="mb-1.5 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wide text-cyan-300">
      <Lightbulb aria-hidden="true" className="h-4 w-4 shrink-0" />
      {title}
    </h4>
    <div>{children}</div>
  </aside>
);
