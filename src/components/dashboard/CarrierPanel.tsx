import React, { useMemo, useState, useEffect } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { CARRIER_NAMES, FAA_ECONOMIC_CONSTANTS } from '../../utils/referenceData';
import { MONTH_NAMES_FULL } from '../../utils/constants';
import { InsightCard } from './InsightCard';
import { Building2, Search, Play, Pause, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

export const CarrierPanel: React.FC = () => {
  const { rawRows, filters, viewMode } = useFlightStore();
  const [metricToggle, setMetricToggle] = useState<'rate' | 'duration'>('rate');
  const [searchTerm, setSearchTerm] = useState('');

  // State Simulasi Bulanan & Zoom
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulatedMonth, setSimulatedMonth] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

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
      if (simulatedMonth !== null && Number(row.MONTH) !== simulatedMonth) return;
      if (simulatedMonth === null && filters.month !== 'ALL' && String(row.MONTH) !== filters.month) return;
      if (filters.carrier !== 'ALL' && row.UNIQUE_CARRIER !== filters.carrier) return;

      const code = row.UNIQUE_CARRIER || 'Unknown';
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

      const tf = Number(row.DEPARTURES_PERFORMED) || 0;
      const dMins = Number(row.TOTAL_ARR_DELAY_MINUTES) || 0;
      const dFlights = Number(row.ARR_DELAY_FLIGHTS) || 0;

      map[code].totalFlights += tf;
      map[code].delayedFlights += dFlights;
      map[code].cancelledFlights += Number(row.CANCELLED_FLIGHTS) || 0;
      map[code].weightedArrDelay += dMins;
      map[code].totalDelayMinutes += dMins;
      map[code].totalSeats += Number(row.SEATS) || 0;
      map[code].totalPassengers += Number(row.PASSENGERS) || 0;
    });

    return Object.values(map)
      .map((item) => {
        const delayRate = item.totalFlights > 0 ? (item.delayedFlights / item.totalFlights) * 100 : 0;
        const avgDelay = item.delayedFlights > 0 ? item.weightedArrDelay / item.delayedFlights : 0;
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
  }, [rawRows, filters, simulatedMonth, metricToggle]);

  const displayedCarriers = useMemo(() => {
    const filtered = carrierMetrics.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (zoomLevel > 1) {
      return filtered.slice(0, Math.max(3, Math.floor(filtered.length / zoomLevel)));
    }
    return filtered;
  }, [carrierMetrics, searchTerm, zoomLevel]);
  const highestDelayCarrier = carrierMetrics.reduce<(typeof carrierMetrics)[number] | null>(
    (highest, carrier) => !highest || carrier.delayRate > highest.delayRate ? carrier : highest,
    null,
  );
  const lowestDelayCarrier = carrierMetrics.reduce<(typeof carrierMetrics)[number] | null>(
    (lowest, carrier) => !lowest || carrier.delayRate < lowest.delayRate ? carrier : lowest,
    null,
  );

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Performa Maskapai Penerbangan</h2>
            <p className="text-slate-400 text-xs">
              Peringkat keandalan operasional maskapai domestik berdasarkan tingkat delay dan ketepatan waktu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMetricToggle('rate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              metricToggle === 'rate' ? 'bg-cyan-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            % Tingkat Delay
          </button>
          <button
            onClick={() => setMetricToggle('duration')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              metricToggle === 'duration' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rata-Rata Menit
          </button>
        </div>
      </div>

      {/* CARD GRAFIK PERFORMA DENGAN TOOLBAR LEBIH LENGKAP */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white">
              Peringkat Maskapai Berdasarkan {metricToggle === 'rate' ? 'Tingkat Delay (%)' : 'Rata-Rata Menit Delay'}
            </h3>
            {simulatedMonth && (
              <p className="text-xs text-cyan-400 font-mono mt-0.5">
                📅 Simulasi Bulan: {MONTH_NAMES_FULL[simulatedMonth - 1]}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-cyan-500/30 transition cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Jeda' : 'Simulasi Bulan'}
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-1" />

            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.5, 2.5))}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition cursor-pointer"
              title="Zoom In Top Rank"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.5, 1))}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setSimulatedMonth(null);
                setZoomLevel(1);
              }}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition cursor-pointer"
              title="Reset Tampilan Utama"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayedCarriers} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="code" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey={metricToggle === 'rate' ? 'delayRate' : 'avgDelay'} radius={[4, 4, 0, 0]}>
                {displayedCarriers.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.delayRate > 22 ? '#ef4444' : entry.delayRate > 18 ? '#f59e0b' : '#06b6d4'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <InsightCard title="Insight perbandingan maskapai">
          {highestDelayCarrier && lowestDelayCarrier
            ? `${highestDelayCarrier.code} mencatat delay rate tertinggi (${highestDelayCarrier.delayRate}%), sementara ${lowestDelayCarrier.code} terendah (${lowestDelayCarrier.delayRate}%) pada cakupan filter ini.`
            : 'Belum ada cukup data maskapai pada cakupan filter ini.'}{' '}
          Delay rate adalah jumlah penerbangan terlambat dibagi keberangkatan, sedangkan rata-rata menit
          hanya dihitung di antara penerbangan yang terlambat. Baca kedua metrik bersama volume dan load factor;
          maskapai dengan sedikit penerbangan lebih mudah berubah peringkatnya.
        </InsightCard>
      </div>

      {/* TABEL DETAIL MASKAPAI */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">Detail Ringkasan Maskapai</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode/nama maskapai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-3">Maskapai</th>
                <th className="py-3 px-3">Total Penerbangan</th>
                <th className="py-3 px-3">% Delay</th>
                <th className="py-3 px-3">Rata-Rata Delay</th>
                <th className="py-3 px-3">Seat Load Factor</th>
                {viewMode === 'analyst' && <th className="py-3 px-3">Estimasi Kerugian (USD)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedCarriers.map((c) => (
                <tr key={c.code} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-[11px]">{c.code}</span>
                    {c.name}
                  </td>
                  <td className="py-3 px-3 text-slate-300">{c.totalFlights.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-3 font-semibold text-rose-400">{c.delayRate}%</td>
                  <td className="py-3 px-3 text-slate-300">{c.avgDelay} mnt</td>
                  <td className="py-3 px-3 text-slate-300">{c.loadFactor}%</td>
                  {viewMode === 'analyst' && (
                    <td className="py-3 px-3 text-violet-400 font-semibold">${(c.economicLossUSD / 1000000).toFixed(2)}M</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InsightCard title="Cara membaca tabel">
          Total penerbangan adalah agregasi seluruh baris dataset untuk setiap kode maskapai. Load factor =
          penumpang ÷ kursi; perkiraan kerugian (jika mode analis aktif) mengalikan menit delay dengan asumsi
          biaya FAA yang ditetapkan aplikasi, sehingga merupakan estimasi model biaya, bukan kerugian akuntansi aktual.
        </InsightCard>
      </div>
    </div>
  );
};