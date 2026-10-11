import React from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { MONTH_NAMES_FULL } from '../../utils/constants';
import { Filter, RotateCcw, Layers } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { filters, setFilter, resetFilters, viewMode, setViewMode, getFilteredRows } = useFlightStore();
  const filteredRows = getFilteredRows();

  return (
    <aside className="w-full lg:w-72 shrink-0 p-6 space-y-6 border-r border-slate-800/80 bg-slate-950/30 backdrop-blur-xl">
      <div className="p-4 rounded-2xl glass-panel space-y-3 cockpit-card-normal">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> TAMPILAN PERSPEKTIF
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
          <button
            onClick={() => setViewMode('public')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'public'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Publik
          </button>
          <button
            onClick={() => setViewMode('analyst')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'analyst'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Analis
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl cockpit-card-normal space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" /> FILTER DATA
          </span>
          <button
            onClick={resetFilters}
            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-300 uppercase font-bold block mb-1">
            Tahun Penerbangan
          </label>
          <select
            value={filters.year || '2025'}
            onChange={(e) => setFilter('year', e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="ALL">Semua Tahun (2024 - 2025)</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-300 uppercase font-bold block mb-1">
            Bulan
          </label>
          <select
            value={filters.month || 'ALL'}
            onChange={(e) => setFilter('month', e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="ALL">Semua Bulan (Januari – Desember)</option>
            {MONTH_NAMES_FULL.map((m, idx) => (
              <option key={idx + 1} value={String(idx + 1)}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-300 uppercase font-bold block mb-1">
            Maskapai (Carrier)
          </label>
          <select
            value={filters.carrier || 'ALL'}
            onChange={(e) => setFilter('carrier', e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="ALL">Semua Maskapai</option>
            <option value="DL">Delta Air Lines (DL)</option>
            <option value="AA">American Airlines (AA)</option>
            <option value="UA">United Airlines (UA)</option>
            <option value="WN">Southwest Airlines (WN)</option>
            <option value="B6">JetBlue Airways (B6)</option>
            <option value="AS">Alaska Airlines (AS)</option>
          </select>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl cockpit-card-normal text-[11px] font-mono text-slate-300 space-y-1">
        <p className="text-[10px] text-slate-400 uppercase font-bold">Total Baris Terfilter:</p>
        <p className="text-sm font-bold text-cyan-400">
          {filteredRows.length.toLocaleString('id-ID')} Penerbangan
        </p>
      </div>
    </aside>
  );
};