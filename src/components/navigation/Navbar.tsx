import React from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { Plane, LayoutDashboard, Compass, BarChart3, Route as RouteIcon, Building2, Sliders, BookOpenCheck, User } from 'lucide-react';
import type { ActiveMenu } from '../../types/flight';

interface NavbarProps {
  onReturnHero: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReturnHero }) => {
  const { activeMenu, setActiveMenu } = useFlightStore();

  const navItems: { id: ActiveMenu; label: string; icon: React.ElementType }[] = [
    { id: 'OVERVIEW', label: 'Ringkasan Utama', icon: LayoutDashboard },
    { id: 'INSIGHTS', label: 'Wawasan Operasional', icon: Compass },
    { id: 'AIRLINE', label: 'Performa Maskapai', icon: BarChart3 },
    { id: 'ROUTE', label: 'Analisis Rute', icon: RouteIcon },
    { id: 'AIRPORT', label: 'Aktivitas Bandara', icon: Building2 },
    { id: 'FACTORS', label: 'Faktor Keterlambatan', icon: Sliders },
    { id: 'METHODOLOGY', label: 'Data & Metodologi', icon: BookOpenCheck },
  ];

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-6 py-3 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => {
          setActiveMenu('OVERVIEW');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        aria-label="FlightInsight — kembali ke ringkasan utama"
        className="flex shrink-0 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-2 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Plane className="h-5 w-5" />
        </div>
        <div>
          <h1 className="flex items-center gap-1.5 font-mono text-base font-bold tracking-wider text-white">
            Flight<span className="text-cyan-400">Insight</span>
          </h1>
          <p className="font-mono text-[9px] tracking-widest text-slate-400">SISTEM ANALISIS PENERBANGAN NASIONAL</p>
        </div>
      </button>

      <nav aria-label="Menu dashboard" className="hidden max-w-[68vw] items-center gap-1 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/60 p-1 backdrop-blur-md md:flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveMenu(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'border border-cyan-400/50 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onReturnHero}
          aria-label="Kembali ke halaman pembuka"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-1.5 text-xs font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]"
        >
          <span className="hidden sm:inline">Eksplorasi Data</span>
          <Plane className="h-4 w-4 sm:hidden" aria-hidden="true" />
        </button>
        <div aria-hidden="true" className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-cyan-400">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
};