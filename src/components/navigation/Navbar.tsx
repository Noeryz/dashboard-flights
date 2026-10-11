import React from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { Plane, LayoutDashboard, Compass, BarChart3, Route as RouteIcon, Building2, Sliders, User } from 'lucide-react';
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
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Plane className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wider text-white flex items-center gap-1.5 font-mono">
            Flight<span className="text-cyan-400">Insight</span>
          </h1>
          <p className="text-[9px] font-mono text-slate-400 tracking-widest uppercase">
            SISTEM ANALISIS PENERBANGAN NASIONAL
          </p>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={onReturnHero}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-bold text-xs flex items-center gap-2 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all cursor-pointer"
        >
          Eksplorasi Data
        </button>
        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};