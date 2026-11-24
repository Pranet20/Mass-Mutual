import React from 'react';

export const StatCardSkeleton = () => (
  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center justify-between">
    <div className="space-y-3 w-3/4">
      <div className="h-3 bg-slate-800 rounded w-1/2"></div>
      <div className="h-7 bg-slate-800 rounded w-3/4"></div>
      <div className="h-2 bg-slate-800 rounded w-1/3"></div>
    </div>
    <div className="w-12 h-12 rounded-xl bg-slate-800 flex-shrink-0"></div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
    <div className="p-4 border-b border-slate-800 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-800 rounded flex-1"></div>
      ))}
    </div>
    <div className="divide-y divide-slate-800/60">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-4 flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 bg-slate-800/70 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-800 rounded w-1/3"></div>
      <div className="h-3 bg-slate-800 rounded w-1/6"></div>
    </div>
    <div className="h-64 bg-slate-800/40 rounded-xl flex items-end justify-around p-4 gap-2">
      <div className="w-12 bg-slate-800 rounded-t h-3/5"></div>
      <div className="w-12 bg-slate-800 rounded-t h-4/5"></div>
      <div className="w-12 bg-slate-800 rounded-t h-2/5"></div>
      <div className="w-12 bg-slate-800 rounded-t h-5/6"></div>
      <div className="w-12 bg-slate-800 rounded-t h-1/2"></div>
    </div>
  </div>
);

export default { StatCardSkeleton, TableSkeleton, ChartSkeleton };
