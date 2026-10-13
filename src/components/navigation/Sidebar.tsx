import React, { useMemo } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { MONTH_NAMES_FULL } from '../../utils/constants';
import { Filter, RotateCcw, Layers } from 'lucide-react';
import { getCarrierDisplayName } from '../../utils/referenceData';

export const Sidebar: React.FC = () => {
  const { rawRows, filters, setFilter, resetFilters, viewMode, setViewMode, getFilteredRows } = useFlightStore();
  const filteredRows = getFilteredRows();
  const carrierCodes = useMemo(
    () => Array.from(new Set(rawRows.map((row) => String(row.UNIQUE_CARRIER || '').trim()).filter(Boolean))).sort(),
    [rawRows],
  );

  return (
    <aside className="w-full shrink-0 space-y-6 border-r border-slate-800/80 bg-slate-950/30 p-6 backdrop-blur-xl lg:w-72">
      <div className="p-4 rounded-2xl glass-panel space-y-3 cockpit-card-normal">
        <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" /> TAMPILAN PERSPEKTIF
          </span>
        </div>

        <div role="group" aria-label="Pilih mode tampilan" className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 p-1">
          <button
            type="button"
            onClick={() => setViewMode('public')}
            aria-pressed={viewMode === 'public'}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'public'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Publik
          </button>
          <button
            type="button"
            onClick={() => setViewMode('analyst')}
            aria-pressed={viewMode === 'analyst'}
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
          <span className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            <Filter className="h-4 w-4 text-cyan-400" /> FILTER DATA
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="flex cursor-pointer items-center gap-1 font-mono text-[10px] text-cyan-400 transition-colors hover:text-cyan-300"
            aria-label="Reset semua filter"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div>
          <label htmlFor="filter-year" className="mb-1 block font-mono text-[10px] font-bold uppercase text-slate-300">
            Tahun Penerbangan
          </label>
          <select
            id="filter-year"
            value={filters.year || '2025'}
            onChange={(e) => setFilter('year', e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 font-mono text-xs text-cyan-400 focus:border-cyan-400"
          >
            <option value="ALL">Semua Tahun (2024 - 2025)</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-month" className="mb-1 block font-mono text-[10px] font-bold uppercase text-slate-300">
            Bulan
          </label>
          <select
            id="filter-month"
            value={filters.month || 'ALL'}
            onChange={(e) => setFilter('month', e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 font-mono text-xs text-cyan-400 focus:border-cyan-400"
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
          <label htmlFor="filter-carrier" className="mb-1 block font-mono text-[10px] font-bold uppercase text-slate-300">
            Maskapai (Carrier)
          </label>
          <select
            id="filter-carrier"
            value={filters.carrier || 'ALL'}
            onChange={(e) => setFilter('carrier', e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 font-mono text-xs text-cyan-400 focus:border-cyan-400"
          >
            <option value="ALL">Semua Maskapai</option>
            {carrierCodes.map((code) => (
              <option key={code} value={code}>{getCarrierDisplayName(code)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1 rounded-2xl p-3.5 font-mono text-[11px] text-slate-300 cockpit-card-normal">
        <p className="text-[10px] font-bold uppercase text-slate-400">Total Baris Terfilter:</p>
        <p className="text-sm font-bold text-cyan-400">
          {filteredRows.length.toLocaleString('id-ID')} baris agregat
        </p>
      </div>
    </aside>
  );
};