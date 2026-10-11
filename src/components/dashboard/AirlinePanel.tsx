import React, { useMemo, useState } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { CARRIER_NAMES, FAA_ECONOMIC_CONSTANTS } from '../../utils/referenceData';
import { Building2, Search } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export const AirlinePanel: React.FC = () => {
  const { rawRows, filters, viewMode } = useFlightStore();
  const [metricToggle, setMetricToggle] = useState<'rate' | 'duration'>('rate');
  const [searchTerm, setSearchTerm] = useState('');

  const carrierMetrics = useMemo(() => {
    const map: Record<
      string,
      {
        code: string;
        name: string;
        totalFlights: number;
        delayedFlights: number;
        cancelledFlights: number;
        weightedArrDelay: number;
        totalDelayMinutes: number;
        totalSeats: number;
        totalPassengers: number;
      }
    > = {};

    rawRows.forEach((row) => {
      if (filters.year !== 'ALL' && String(row.YEAR) !== filters.year) return;
      if (filters.month !== 'ALL' && String(row.MONTH) !== filters.month) return;
      if (filters.carrier !== 'ALL' && row.OP_UNIQUE_CARRIER !== filters.carrier) return;

      const code = row.OP_UNIQUE_CARRIER || 'Unknown';
      if (!map[code]) {
        map[code] = {
          code,
          name: CARRIER_NAMES[code] || code,
          totalFlights: 0,
          delayedFlights: 0,
          cancelledFlights: 0,
          weightedArrDelay: 0,
          totalDelayMinutes: 0,
          totalSeats: 0,
          totalPassengers: 0,
        };
      }

      const tf = Number(row.total_flights) || 0;
      const avgDelay = Number(row.avg_arr_delay) || 0;

      map[code].totalFlights += tf;
      map[code].delayedFlights += Number(row.delayed_flights) || 0;
      map[code].cancelledFlights += Number(row.cancelled_flights) || 0;
      map[code].weightedArrDelay += avgDelay * tf;
      if (avgDelay > 0) {
        map[code].totalDelayMinutes += avgDelay * tf;
      }
      map[code].totalSeats += Number(row.total_seats) || 0;
      map[code].totalPassengers += Number(row.total_passengers) || 0;
    });

    return Object.values(map)
      .map((item) => {
        const delayRate = item.totalFlights > 0 ? (item.delayedFlights / item.totalFlights) * 100 : 0;
        const avgDelay = item.totalFlights > 0 ? item.weightedArrDelay / item.totalFlights : 0;
        const cancelRate = item.totalFlights > 0 ? (item.cancelledFlights / item.totalFlights) * 100 : 0;
        const loadFactor = item.totalSeats > 0 ? (item.totalPassengers / item.totalSeats) * 100 : 0;
        const economicLossUSD = item.totalDelayMinutes * FAA_ECONOMIC_CONSTANTS.TOTAL_COST_PER_MIN_USD;

        return {
          ...item,
          delayRate: Number(delayRate.toFixed(1)),
          avgDelay: Number(avgDelay.toFixed(1)),
          cancelRate: Number(cancelRate.toFixed(2)),
          loadFactor: Number(loadFactor.toFixed(1)),
          economicLossUSD: Math.round(economicLossUSD),
        };
      })
      .sort((a, b) => (metricToggle === 'rate' ? b.delayRate - a.delayRate : b.avgDelay - a.avgDelay));
  }, [rawRows, filters, metricToggle]);

  const filteredCarriers = useMemo(() => {
    return carrierMetrics.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [carrierMetrics, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-flight-violet/10 border border-flight-violet/30 text-flight-violet">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Performa & Peringkat Maskapai</h2>
            <p className="text-slate-400 text-xs">
              Evaluasi keandalan operasional 15 maskapai domestik AS berdasarkan standar FAA.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMetricToggle('rate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              metricToggle === 'rate'
                ? 'bg-flight-cyan text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            % Keterlambatan (&gt;15m)
          </button>
          <button
            onClick={() => setMetricToggle('duration')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              metricToggle === 'duration'
                ? 'bg-flight-amber text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Durasi Avg Delay (Mnt)
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        <h3 className="text-base font-semibold text-white mb-4">
          Peringkat Maskapai Berdasarkan {metricToggle === 'rate' ? 'Tingkat Delay (%)' : 'Rata-Rata Menit Delay'}
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={carrierMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="code" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
              />
              <Bar
                dataKey={metricToggle === 'rate' ? 'delayRate' : 'avgDelay'}
                name={metricToggle === 'rate' ? 'Delay Rate (%)' : 'Avg Delay (Mnt)'}
                radius={[4, 4, 0, 0]}
              >
                {carrierMetrics.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.delayRate > 22
                        ? '#ef4444'
                        : entry.delayRate > 18
                        ? '#f59e0b'
                        : '#06b6d4'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">Matriks Detail Maskapai</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode/nama maskapai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-flight-cyan"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-3">Kode & Nama Maskapai</th>
                <th className="py-3 px-3">Total Penerbangan</th>
                <th className="py-3 px-3">% Delay</th>
                <th className="py-3 px-3">Avg Delay</th>
                <th className="py-3 px-3">Seat Load Factor</th>
                {viewMode === 'analyst' && (
                  <>
                    <th className="py-3 px-3">% Pembatalan</th>
                    <th className="py-3 px-3">Kerugian Finansial (USD)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCarriers.map((c) => (
                <tr key={c.code} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-flight-cyan font-mono text-[11px]">
                      {c.code}
                    </span>
                    {c.name}
                  </td>
                  <td className="py-3 px-3 text-slate-300">{(c.totalFlights / 1000).toFixed(1)}k</td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-semibold ${
                        c.delayRate > 22
                          ? 'text-flight-coral'
                          : c.delayRate > 18
                          ? 'text-flight-amber'
                          : 'text-emerald-400'
                      }`}
                    >
                      {c.delayRate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{c.avgDelay} mnt</td>
                  <td className="py-3 px-3 text-slate-300">{c.loadFactor}%</td>
                  {viewMode === 'analyst' && (
                    <>
                      <td className="py-3 px-3 text-slate-300">{c.cancelRate}%</td>
                      <td className="py-3 px-3 font-mono text-flight-violet font-semibold">
                        ${(c.economicLossUSD / 1000000).toFixed(2)}M
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};