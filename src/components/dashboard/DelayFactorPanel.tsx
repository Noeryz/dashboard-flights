import React, { useMemo } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { FAA_ECONOMIC_CONSTANTS } from '../../utils/referenceData';
import { AlertTriangle, Clock, CloudRain, ShieldAlert, PlaneTakeoff, Building2 } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export const DelayFactorPanel: React.FC = () => {
  const { rawRows, filters, viewMode } = useFlightStore();

  const factorMetrics = useMemo(() => {
    let lateAircraft = 0;
    let carrier = 0;
    let nas = 0;
    let weather = 0;
    let security = 0;

    rawRows.forEach((row) => {
      if (filters.year !== 'ALL' && String(row.YEAR) !== filters.year) return;
      if (filters.month !== 'ALL' && String(row.MONTH) !== filters.month) return;
      if (filters.carrier !== 'ALL' && row.UNIQUE_CARRIER !== filters.carrier) return;

      lateAircraft += Number(row.LATE_AIRCRAFT_DELAY_MINUTES) || 0;
      carrier += Number(row.CARRIER_DELAY_MINUTES) || 0;
      nas += Number(row.NAS_DELAY_MINUTES) || 0;
      weather += Number(row.WEATHER_DELAY_MINUTES) || 0;
      security += Number(row.SECURITY_DELAY_MINUTES) || 0;
    });

    const totalMinutes = lateAircraft + carrier + nas + weather + security;

    const items = [
      { name: 'Keterlambatan lanjutan pesawat (Late-arriving aircraft)', minutes: Math.round(lateAircraft), icon: PlaneTakeoff, color: '#f59e0b' },
      { name: 'Carrier (Internal Maskapai)', minutes: Math.round(carrier), icon: Building2, color: '#06b6d4' },
      { name: 'NAS (Sistem Navigasi Udara)', minutes: Math.round(nas), icon: Clock, color: '#8b5cf6' },
      { name: 'Weather (Cuaca Buruk)', minutes: Math.round(weather), icon: CloudRain, color: '#ef4444' },
      { name: 'Security (Keamanan)', minutes: Math.round(security), icon: ShieldAlert, color: '#10b981' },
    ];

    return items.map((item) => {
      const share = totalMinutes > 0 ? (item.minutes / totalMinutes) * 100 : 0;
      const economicCostUSD = item.minutes * FAA_ECONOMIC_CONSTANTS.TOTAL_COST_PER_MIN_USD;
      return {
        ...item,
        share: Number(share.toFixed(1)),
        economicCostUSD: Math.round(economicCostUSD),
      };
    });
  }, [rawRows, filters]);

  const totalDelayMinutesSum = useMemo(() => {
    return factorMetrics.reduce((acc, curr) => acc + curr.minutes, 0);
  }, [factorMetrics]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/85 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-flight-amber/10 border border-flight-amber/30 text-flight-amber">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Kategori Keterlambatan yang Tercatat</h2>
            <p className="text-slate-400 text-xs">
              Perbandingan akumulasi menit pada lima kategori keterlambatan dalam filter aktif.
            </p>
          </div>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-right">
          <p className="text-slate-400">Total Akumulasi Delay</p>
          <p className="text-flight-amber font-mono font-bold text-base">
            {(totalDelayMinutesSum / 1000000).toFixed(2)}M Menit
          </p>
        </div>
      </div>

      {/* Domino Effect Explainer Box */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-flight-amber/30 bg-gradient-to-r from-flight-amber/10 via-transparent to-transparent space-y-2">
        <h3 className="text-sm font-bold text-flight-amber flex items-center gap-2">
          💡 Makna kategori Late-arriving aircraft
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Kategori ini digunakan ketika pesawat yang akan menjalankan penerbangan berikutnya tiba terlambat dari penerbangan sebelumnya, sehingga keterlambatan terbawa ke jadwal berikutnya. Ini menjelaskan mekanisme penularan delay, bukan penyebab awal pesawat sebelumnya terlambat. CSV agregat tidak memuat identitas pesawat atau urutan penerbangan untuk menelusuri kejadian individual.
        </p>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart Proporsi Menit */}
        <div className="p-6 rounded-2xl bg-slate-900/85 border border-slate-800/80 flex flex-col justify-between">
          <h3 className="text-base font-semibold text-white mb-2">Proporsi Menit per Kategori Delay (%)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={factorMetrics}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="share"
                  nameKey="name"
                >
                  {factorMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val) => [`${val}%`, 'Kontribusi']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart Total Menit */}
        <div className="p-6 rounded-2xl bg-slate-900/85 border border-slate-800/80 flex flex-col justify-between">
          <h3 className="text-base font-semibold text-white mb-2">Total Akumulasi Menit (Juta Mnt)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={factorMetrics.map((f) => ({ ...f, millions: Number((f.minutes / 1000000).toFixed(2)) }))}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.split(' ')[0]} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="millions" name="Juta Menit" radius={[4, 4, 0, 0]}>
                  {factorMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Metric Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {factorMetrics.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/85 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5" style={{ color: f.color }} />
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800" style={{ color: f.color }}>
                  {f.share}%
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate">{f.name}</p>
              <p className="text-lg font-bold text-white">{(f.minutes / 1000000).toFixed(2)}M <span className="text-xs font-normal text-slate-400">mnt</span></p>
              {viewMode === 'analyst' && (
                <p className="text-[11px] font-mono text-flight-violet pt-1 border-t border-slate-800">
                  Est. ${(f.economicCostUSD / 1000000).toFixed(1)}M USD
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};