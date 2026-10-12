import React, { useMemo, useState, useEffect } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { MONTH_NAMES_FULL } from '../../utils/constants';
import { Sliders, Play, Pause, ZoomIn, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { InsightCard } from './InsightCard';

export const FactorsPanel: React.FC = () => {
  const { getFilteredRows } = useFlightStore();
  const filteredRows = getFilteredRows();

  const [isPlaying, setIsPlaying] = useState(false);
  const [simulatedMonth, setSimulatedMonth] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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

  const factorsData = useMemo(() => {
    let lateAircraftMin = 0;
    let nasMin = 0;
    let carrierMin = 0;
    let weatherMin = 0;
    let securityMin = 0;

    filteredRows.forEach((r) => {
      if (simulatedMonth !== null && Number(r.MONTH) !== simulatedMonth) return;

      lateAircraftMin += Number(r.LATE_AIRCRAFT_DELAY_MINUTES || 0);
      nasMin += Number(r.NAS_DELAY_MINUTES || 0);
      carrierMin += Number(r.CARRIER_DELAY_MINUTES || 0);
      weatherMin += Number(r.WEATHER_DELAY_MINUTES || 0);
      securityMin += Number(r.SECURITY_DELAY_MINUTES || 0);
    });

    const items = [
      { factor: 'Rotasi Pesawat (Late Aircraft)', minutes: Math.round(lateAircraftMin), color: '#06b6d4' },
      { factor: 'Sistem Navigasi Udara (NAS)', minutes: Math.round(nasMin), color: '#8b5cf6' },
      { factor: 'Internal Maskapai (Carrier)', minutes: Math.round(carrierMin), color: '#f59e0b' },
      { factor: 'Cuaca Buruk (Weather)', minutes: Math.round(weatherMin), color: '#f43f5e' },
      { factor: 'Keamanan (Security)', minutes: Math.round(securityMin), color: '#10b981' },
    ];

    return items;
  }, [filteredRows, simulatedMonth]);
  const visibleFactorsData = zoomScale > 1
    ? [...factorsData].filter((factor) => factor.minutes > 0).sort((a, b) => b.minutes - a.minutes).slice(0, 3)
    : factorsData;
  const totalDelayMinutes = factorsData.reduce((total, factor) => total + factor.minutes, 0);
  const leadingFactor = [...factorsData].sort((a, b) => b.minutes - a.minutes)[0];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl cockpit-card-cyan flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider">
              Analisis Faktor Keterlambatan Penerbangan
            </h2>
            <p className="text-xs text-slate-300">Dekomposisi total menit delay berdasarkan standar kategori BTS & FAA</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl cockpit-card-normal space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
              Total Menit Delay Per Kategori
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
              Simulasi Bulan
            </button>

            <button
              onClick={() => setZoomScale(2)}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 cursor-pointer"
              title="Zoom 3 Faktor Terbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setSimulatedMonth(null);
                setZoomScale(1);
              }}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visibleFactorsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="factor" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#06b6d4', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val) => [`${Number(val).toLocaleString('id-ID')} Menit`, 'Total Delay']}
              />
              <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                {visibleFactorsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <InsightCard title="Insight penyebab keterlambatan">
          {leadingFactor && totalDelayMinutes > 0
            ? `${leadingFactor.factor} merupakan kontributor terbesar pada filter ini, sebesar ${leadingFactor.minutes.toLocaleString('id-ID')} menit (${((leadingFactor.minutes / totalDelayMinutes) * 100).toFixed(1)}% dari total lima kategori).`
            : 'Belum ada menit keterlambatan yang tercatat pada filter ini.'}{' '}
          Nilai adalah akumulasi menit delay yang dilaporkan per kategori, bukan jumlah kejadian. Kategori bisa
          menunjukkan bagian dari sistem yang mencatat keterlambatan; asosiasi kategori tidak membuktikan penyebab
          tunggal atau hubungan kausal.
        </InsightCard>
      </div>
    </div>
  );
};