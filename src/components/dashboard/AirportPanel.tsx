import React, { useMemo, useState, useEffect } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { MONTH_NAMES_FULL } from '../../utils/constants';
import { Building2, MapPin, Globe, Play, Pause, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export const AirportPanel: React.FC = () => {
  const { getFilteredRows } = useFlightStore();
  const filteredRows = getFilteredRows();

  const [isPlaying, setIsPlaying] = useState(false);
  const [simulatedMonth, setSimulatedMonth] = useState<number | null>(null);
  const [zoomLimit, setZoomLimit] = useState<number>(8);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setSimulatedMonth((prev) => {
          if (prev === null || prev >= 12) return 1;
          return prev + 1;
        });
      }, 1300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const airportStats = useMemo(() => {
    const originMap: Record<string, { flights: number; passengers: number }> = {};

    filteredRows.forEach((r) => {
      if (simulatedMonth !== null && Number(r.MONTH) !== simulatedMonth) return;

      const orig = String(r.ORIGIN || 'ATL').trim().toUpperCase();
      const flights = Number(r.DEPARTURES_PERFORMED || 0);
      const pax = Number(r.PASSENGERS || 0);

      if (!originMap[orig]) {
        originMap[orig] = { flights: 0, passengers: 0 };
      }
      originMap[orig].flights += flights;
      originMap[orig].passengers += pax;
    });

    return Object.entries(originMap)
      .map(([code, data]) => ({ airport: code, flights: data.flights, passengers: data.passengers }))
      .sort((a, b) => b.flights - a.flights)
      .slice(0, zoomLimit);
  }, [filteredRows, simulatedMonth, zoomLimit]);

  const topAirport = airportStats[0] || { airport: 'ATL', flights: 0, passengers: 0 };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl cockpit-card-cyan flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider">Aktivitas Volume Bandara Utama</h2>
            <p className="text-xs text-slate-300">
              Pusat Hub Tersibuk: <strong className="text-cyan-400 font-mono">{topAirport.airport}</strong> ({topAirport.flights.toLocaleString('id-ID')} Penerbangan)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-3xl cockpit-card-normal space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" /> Volume Penerbangan Berdasarkan Bandara Asal
              </h3>
              {simulatedMonth && (
                <p className="text-xs text-cyan-400 font-mono mt-0.5">📅 Bulan: {MONTH_NAMES_FULL[simulatedMonth - 1]}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                Simulasi
              </button>

              <button
                onClick={() => setZoomLimit(5)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 cursor-pointer"
                title="Zoom Top 5 Hub"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setZoomLimit(12)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 cursor-pointer"
                title="Tampilkan 12 Bandara"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setSimulatedMonth(null);
                  setZoomLimit(8);
                }}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 cursor-pointer"
                title="Reset Axis Utama"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={airportStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="airport" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#06b6d4', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [Number(val).toLocaleString('id-ID'), 'Volume Penerbangan']}
                />
                <Bar dataKey="flights" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                  {airportStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 p-6 rounded-3xl cockpit-card-normal space-y-4">
          <h3 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-400" /> Rincian Hub Utama
          </h3>
          <div className="space-y-2.5 font-mono text-xs">
            {airportStats.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <span className="font-bold text-cyan-400">{item.airport}</span>
                <span className="text-slate-300">{item.flights.toLocaleString('id-ID')} Penerbangan</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};