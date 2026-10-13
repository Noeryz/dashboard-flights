import React, { useMemo, useState, useEffect } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { FAA_ECONOMIC_CONSTANTS } from '../../utils/referenceData';
import { getDelayDurationObservation } from '../../utils/flightAnalytics';
import { MONTH_NAMES_FULL } from '../../utils/constants';
import { InsightCard } from './InsightCard';
import { Building2, Search, Play, Pause, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
} from 'recharts';

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
        totalFlights: number;
        scheduledFlights: number;
        delayedFlights: number;
        averageDelayFlights: number;
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
          totalFlights: 0,
          scheduledFlights: 0,
          delayedFlights: 0,
          averageDelayFlights: 0,
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
      const durationObservation = getDelayDurationObservation(row);

      map[code].totalFlights += tf;
      map[code].scheduledFlights += Number(row.SCHEDULED_FLIGHTS) || tf;
      map[code].delayedFlights += dFlights;
      map[code].cancelledFlights += Number(row.CANCELLED_FLIGHTS) || 0;
      map[code].weightedArrDelay += durationObservation.delayMinutes;
      map[code].averageDelayFlights += durationObservation.delayedFlights;
      map[code].totalDelayMinutes += dMins;
      map[code].totalSeats += Number(row.SEATS) || 0;
      map[code].totalPassengers += Number(row.PASSENGERS) || 0;
    });

    return Object.values(map)
      .map((item) => {
        const delayRate = item.totalFlights > 0 ? (item.delayedFlights / item.totalFlights) * 100 : 0;
        const avgDelay = item.averageDelayFlights > 0
          ? item.weightedArrDelay / item.averageDelayFlights
          : null;
        const cancelRate = item.scheduledFlights > 0 ? (item.cancelledFlights / item.scheduledFlights) * 100 : 0;
        const loadFactor = item.totalSeats > 0 ? (item.totalPassengers / item.totalSeats) * 100 : 0;
        const economicLossUSD = item.totalDelayMinutes * FAA_ECONOMIC_CONSTANTS.TOTAL_COST_PER_MIN_USD;

        return {
          ...item,
          delayRate: Number(delayRate.toFixed(1)),
          avgDelay: avgDelay == null ? null : Number(avgDelay.toFixed(1)),
          cancelRate: Number(cancelRate.toFixed(2)),
          loadFactor: Number(loadFactor.toFixed(1)),
          economicLossUSD: Math.round(economicLossUSD),
        };
      })
      .sort((a, b) => metricToggle === 'rate'
        ? b.delayRate - a.delayRate
        : (b.avgDelay ?? -1) - (a.avgDelay ?? -1));
  }, [rawRows, filters, simulatedMonth, metricToggle]);

  const filteredCarriers = useMemo(() =>
    carrierMetrics.filter(
      (carrier) => carrier.code.toLowerCase().includes(searchTerm.toLowerCase())
    ), [carrierMetrics, searchTerm]);
  const volumeDelayCarriers = useMemo(
    () => [...filteredCarriers].sort((a, b) => b.totalFlights - a.totalFlights).slice(0, 12),
    [filteredCarriers],
  );
  const chartCarriers = metricToggle === 'duration'
    ? filteredCarriers.filter((carrier) => carrier.avgDelay !== null)
    : filteredCarriers;
  const carriersWithObservedDuration = carrierMetrics.filter((carrier) => carrier.avgDelay !== null).length;
  const displayedCarriers = useMemo(() => {
    if (zoomLevel > 1) {
      return chartCarriers.slice(0, Math.max(3, Math.floor(chartCarriers.length / zoomLevel)));
    }
    return chartCarriers;
  }, [chartCarriers, zoomLevel]);
  const highestDelayCarrier = carrierMetrics.reduce<(typeof carrierMetrics)[number] | null>(
    (highest, carrier) => !highest || carrier.delayRate > highest.delayRate ? carrier : highest,
    null,
  );
  const lowestDelayCarrier = carrierMetrics.reduce<(typeof carrierMetrics)[number] | null>(
    (lowest, carrier) => !lowest || carrier.delayRate < lowest.delayRate ? carrier : lowest,
    null,
  );
  const totalFlights = carrierMetrics.reduce((sum, carrier) => sum + carrier.totalFlights, 0);
  const totalDelayedFlights = carrierMetrics.reduce((sum, carrier) => sum + carrier.delayedFlights, 0);
  const overallDelayRate = totalFlights > 0 ? (totalDelayedFlights / totalFlights) * 100 : 0;
  const highestDelayAmongVolumeLeaders = volumeDelayCarriers.reduce<(typeof volumeDelayCarriers)[number] | null>(
    (highest, carrier) => !highest || carrier.delayRate > highest.delayRate ? carrier : highest,
    null,
  );
  const volumeLeader = volumeDelayCarriers[0];
  const largestCarrier = carrierMetrics.reduce<(typeof carrierMetrics)[number] | null>(
    (largest, carrier) => !largest || carrier.totalFlights > largest.totalFlights ? carrier : largest,
    null,
  );
  const carrierCodes = new Set(rawRows.map((row) => String(row.UNIQUE_CARRIER || '').trim()).filter(Boolean));

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/85 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Performa Maskapai Penerbangan</h2>
            <p className="text-slate-400 text-xs">
              Tingkat delay dan menit teramati menurut carrier.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            aria-pressed={metricToggle === 'rate'}
            onClick={() => setMetricToggle('rate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              metricToggle === 'rate' ? 'bg-cyan-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            % Tingkat Delay
          </button>
          <button
            type="button"
            aria-pressed={metricToggle === 'duration'}
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
      <div className="p-6 rounded-2xl bg-slate-900/85 border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white">
                Perbandingan Maskapai Berdasarkan {metricToggle === 'rate' ? 'Tingkat Delay (%)' : 'Rata-Rata Menit Delay'}
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">
              {metricToggle === 'duration'
                ? `${carriersWithObservedDuration} dari ${carrierMetrics.length} maskapai memiliki menit delay teramati untuk menghitung rata-rata.`
                : `${displayedCarriers.length} dari ${carrierMetrics.length} maskapai terlihat; tabel tetap memuat semua maskapai.`}
              {metricToggle === 'duration' && ' Maskapai lain tetap ada di tabel, tetapi catatan menit delay-nya kosong atau nol sehingga rata-ratanya tidak dapat dihitung.'}
              {metricToggle === 'rate' && ' Zoom hanya mengubah grafik.'}
            </p>
            {simulatedMonth && (
              <p className="text-xs text-cyan-400 font-mono mt-0.5">
                📅 Simulasi Bulan: {MONTH_NAMES_FULL[simulatedMonth - 1]}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-pressed={isPlaying}
              aria-label={isPlaying ? 'Jeda simulasi bulanan maskapai' : 'Putar simulasi bulanan maskapai'}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-cyan-500/30 transition cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Jeda' : 'Simulasi Bulan'}
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.5, 2.5))}
              aria-label="Perbesar grafik dan fokus pada peringkat tertinggi"
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition cursor-pointer"
              title="Zoom In Top Rank"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.5, 1))}
              aria-label="Perkecil grafik maskapai"
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setSimulatedMonth(null);
                setZoomLevel(1);
              }}
              aria-label="Reset tampilan grafik maskapai"
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
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                labelFormatter={(code) => String(code)}
              />
              <Bar dataKey={metricToggle === 'rate' ? 'delayRate' : 'avgDelay'} radius={[5, 5, 0, 0]}>
                {displayedCarriers.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#10b981' : index < 3 ? '#22d3ee' : '#64748b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <InsightCard title="Temuan pada filter ini">
          {highestDelayCarrier && lowestDelayCarrier
            ? `Kode ${highestDelayCarrier.code} memiliki tingkat tertinggi (${highestDelayCarrier.delayRate}%), sedangkan ${lowestDelayCarrier.code} terendah (${lowestDelayCarrier.delayRate}%). Rata-rata jaringan ${overallDelayRate.toFixed(1)}%.`
            : 'Belum ada cukup data maskapai pada cakupan filter ini.'}{' '}
          Tingkat delay menunjukkan proporsi, bukan jumlah kasus; volume terbesar ada pada kode {largestCarrier?.code ?? '—'}
          {largestCarrier ? ` (${largestCarrier.totalFlights.toLocaleString('id-ID')} keberangkatan)` : ''}.
          Perbedaan ini mencerminkan skala operasi dan proporsi yang berbeda, bukan sebab keterlambatan.
        </InsightCard>
      </div>

      <section className="space-y-4 rounded-3xl cockpit-card-normal p-6">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            Volume penerbangan dan tingkat delay maskapai · {filters.year === 'ALL' ? '2024–2025' : filters.year}
          </h3>
          <p className="mt-1 text-[11px] text-slate-400">
            Dua belas carrier dengan keberangkatan terbanyak · batang menunjukkan volume, garis menunjukkan proporsi penerbangan terlambat.
          </p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={volumeDelayCarriers} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis yAxisId="volume" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis yAxisId="rate" orientation="right" stroke="#fda4af" fontSize={10} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#06b6d4', borderRadius: '12px', fontSize: '12px' }}
                formatter={(value, name) => [
                  name === 'Tingkat delay' ? `${Number(value).toFixed(1)}%` : Number(value).toLocaleString('id-ID'),
                  name,
                ]}
                labelFormatter={(code) => `Kode carrier: ${String(code)}`}
              />
              <Bar yAxisId="volume" dataKey="totalFlights" name="Keberangkatan" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Line yAxisId="rate" dataKey="delayRate" name="Tingkat delay" type="monotone" stroke="#fb7185" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <InsightCard title="Skala operasi dan ketepatan waktu">
          {volumeLeader && highestDelayAmongVolumeLeaders
            ? `${volumeLeader.code} mencatat volume terbesar di antara carrier yang ditampilkan (${volumeLeader.totalFlights.toLocaleString('id-ID')} keberangkatan). Pada kelompok ${volumeDelayCarriers.length} carrier ini, tingkat delay tertinggi ada pada ${highestDelayAmongVolumeLeaders.code} (${highestDelayAmongVolumeLeaders.delayRate.toFixed(1)}%).`
            : 'Belum ada data carrier untuk dibandingkan pada filter ini.'}{' '}
          Tingkat delay jaringan pada filter ini {overallDelayRate.toFixed(1)}%. Volume menunjukkan banyaknya operasi, sedangkan tingkat delay adalah jumlah penerbangan terlambat dibagi keberangkatan; keduanya menggambarkan hal yang berbeda.
        </InsightCard>
      </section>

      {/* TABEL DETAIL MASKAPAI */}
      <div className="p-6 rounded-2xl bg-slate-900/85 border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">Detail Ringkasan Maskapai</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              aria-label="Cari kode carrier"
              placeholder="Cari kode carrier..."
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
              {filteredCarriers.length > 0 ? filteredCarriers.map((c) => (
                <tr key={c.code} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-[11px]">{c.code}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{c.totalFlights.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-3 font-semibold text-rose-400">{c.delayRate}%</td>
                  <td className="py-3 px-3 text-slate-300">
                    {c.avgDelay == null ? 'Tidak tersedia pada data' : `${c.avgDelay} mnt`}
                  </td>
                  <td className="py-3 px-3 text-slate-300">{c.loadFactor}%</td>
                  {viewMode === 'analyst' && (
                    <td className="py-3 px-3 text-violet-400 font-semibold">${(c.economicLossUSD / 1000000).toFixed(2)}M</td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={viewMode === 'analyst' ? 6 : 5} className="p-6 text-center text-slate-400">
                    Tidak ada maskapai yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <InsightCard title="Kode carrier">
          Dataset memuat {carrierCodes.size} kode carrier. Tabel dan grafik menggunakan kode persis seperti yang
          tercatat; angka yang ditampilkan merupakan agregat bulanan seluruh rute dalam filter aktif.
        </InsightCard>
        <InsightCard title="Definisi metrik">
          Total penerbangan adalah agregasi seluruh baris dataset untuk setiap kode maskapai. Load factor =
          penumpang ÷ kursi; tingkat delay membandingkan penerbangan terlambat dengan keberangkatan. Rata-rata menit
          delay hanya menghitung catatan terlambat dengan menit delay teramati. Estimasi biaya (jika mode analis
          aktif) mengalikan menit delay dengan asumsi FAA, bukan kerugian akuntansi aktual.
        </InsightCard>
      </div>
    </div>
  );
};