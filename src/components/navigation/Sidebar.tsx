import React, { useMemo } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { MONTH_NAMES_FULL } from '../../utils/constants';
import { Filter, RotateCcw, Layers, PanelLeftClose } from 'lucide-react';
import { getCarrierDisplayName } from '../../utils/referenceData';

interface SidebarProps {
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { rawRows, filters, setFilter, resetFilters, viewMode, setViewMode, getFilteredRows } = useFlightStore();
  const filteredRows = getFilteredRows();
  const carrierCodes = useMemo(
    () => Array.from(new Set(rawRows.map((row) => String(row.UNIQUE_CARRIER || '').trim()).filter(Boolean))).sort(),
    [rawRows],
  );

  return (
    <aside id="dashboard-sidebar" className="w-full shrink-0 space-y-6 border-r border-slate-800/80 bg-slate-950/85 p-6 lg:w-72">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">Panel samping</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup sidebar"
          aria-controls="dashboard-sidebar"
          aria-expanded={true}
          title="Tutup sidebar"
          className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 transition-colors hover:border-cyan-400/60 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="p-4 rounded-2xl space-y-3 cockpit-card-normal">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-300" /> Tampilan perspektif
          </span>
        </div>

        <div role="group" aria-label="Pilih mode tampilan" className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 p-1">
          <button
            type="button"
            onClick={() => setViewMode('public')}
            aria-pressed={viewMode === 'public'}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'public'
                ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30'
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
                ? 'bg-violet-500/15 text-violet-200 border border-violet-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Analis
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl cockpit-card-normal space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Filter className="h-4 w-4 text-cyan-300" /> Filter data
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="flex cursor-pointer items-center gap-1 text-xs text-cyan-300 transition-colors hover:text-cyan-200"
            aria-label="Reset semua filter"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div>
          <label htmlFor="filter-year" className="mb-1 block text-xs font-medium text-slate-300">
            Tahun Penerbangan
          </label>
          <select
            id="filter-year"
            value={filters.year || '2025'}
            onChange={(e) => setFilter('year', e.target.value)}
            className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400"
          >
            <option value="ALL">Semua Tahun (2024 - 2025)</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-month" className="mb-1 block text-xs font-medium text-slate-300">
            Bulan
          </label>
          <select
            id="filter-month"
            value={filters.month || 'ALL'}
            onChange={(e) => setFilter('month', e.target.value)}
            className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400"
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
          <label htmlFor="filter-carrier" className="mb-1 block text-xs font-medium text-slate-300">
            Maskapai (Carrier)
          </label>
          <select
            id="filter-carrier"
            value={filters.carrier || 'ALL'}
            onChange={(e) => setFilter('carrier', e.target.value)}
            className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400"
          >
            <option value="ALL">Semua Maskapai</option>
            {carrierCodes.map((code) => (
              <option key={code} value={code}>{getCarrierDisplayName(code)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1 rounded-2xl p-3.5 font-mono text-[11px] text-slate-300 cockpit-card-normal">
        <p className="text-xs font-medium text-slate-400">Baris pada filter</p>
        <p className="text-sm font-bold text-cyan-400">
          {filteredRows.length.toLocaleString('id-ID')} baris agregat
        </p>
      </div>
    </aside>
  );
};