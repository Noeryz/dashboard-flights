import React, { useMemo, useState } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { CARRIER_NAMES, FAA_ECONOMIC_CONSTANTS, getCarrierDisplayName } from '../../utils/referenceData';
import { getDelayDurationObservation } from '../../utils/flightAnalytics';
import {
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
} from '../../utils/chartStyles';
import { Building2, Search } from 'lucide-react';
import { InsightCard } from './InsightCard';
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
      if (filters.month !== 'ALL' && String(row.MONTH) !== filters.month) return;
      if (filters.carrier !== 'ALL' && row.UNIQUE_CARRIER !== filters.carrier) return;

      const code = row.UNIQUE_CARRIER || 'Unknown';
      if (!map[code]) {
        map[code] = {
          code,
          name: getCarrierDisplayName(code),
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
      const delayedFlights = Number(row.ARR_DELAY_FLIGHTS) || 0;
      const delayMinutes = Number(row.TOTAL_ARR_DELAY_MINUTES) || 0;
      const durationObservation = getDelayDurationObservation(row);

      map[code].totalFlights += tf;
      map[code].scheduledFlights += Number(row.SCHEDULED_FLIGHTS) || tf;
      map[code].delayedFlights += delayedFlights;
      map[code].cancelledFlights += Number(row.CANCELLED_FLIGHTS) || 0;
      map[code].weightedArrDelay += durationObservation.delayMinutes;
      map[code].averageDelayFlights += durationObservation.delayedFlights;
      map[code].totalDelayMinutes += delayMinutes;
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
  }, [rawRows, filters, metricToggle]);

  const filteredCarriers = useMemo(() => {
    return carrierMetrics.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [carrierMetrics, searchTerm]);
  const totalFlights = carrierMetrics.reduce((sum, carrier) => sum + carrier.totalFlights, 0);
  const totalDelayedFlights = carrierMetrics.reduce((sum, carrier) => sum + carrier.delayedFlights, 0);
  const networkDelayRate = totalFlights > 0 ? (totalDelayedFlights / totalFlights) * 100 : 0;
  const highestDelayCarrier = carrierMetrics.reduce<(typeof carrierMetrics)[number] | null>(
    (highest, carrier) => !highest || carrier.delayRate > highest.delayRate ? carrier : highest,
    null,
  );
  const largestCarrier = carrierMetrics.reduce<(typeof carrierMetrics)[number] | null>(
    (largest, carrier) => !largest || carrier.totalFlights > largest.totalFlights ? carrier : largest,
    null,
  );
  const carrierCodes = new Set(rawRows.map((row) => String(row.UNIQUE_CARRIER || '').trim()).filter(Boolean));
  const namedCarrierCount = Array.from(carrierCodes).filter((code) => CARRIER_NAMES[code]).length;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/85 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-flight-violet/10 border border-flight-violet/30 text-flight-violet">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Perbandingan Kinerja Maskapai</h2>
            <p className="text-slate-400 text-xs">
              Bandingkan frekuensi keterlambatan, durasi rata-rata, dan volume penerbangan maskapai pada filter aktif.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            aria-pressed={metricToggle === 'rate'}
            onClick={() => setMetricToggle('rate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              metricToggle === 'rate'
                ? 'bg-flight-cyan text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            % Keterlambatan
          </button>
          <button
            type="button"
            aria-pressed={metricToggle === 'duration'}
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

      <InsightCard title="Apa yang menonjol pada perbandingan ini?">
        {highestDelayCarrier && largestCarrier
          ? <>
              Pada filter ini, {highestDelayCarrier.name} memiliki tingkat keterlambatan tertinggi (
              {highestDelayCarrier.delayRate}%) dibanding rata-rata tertimbang seluruh maskapai (
              {networkDelayRate.toFixed(1)}%), sementara volume terbesar tercatat pada {largestCarrier.name} (
              {largestCarrier.totalFlights.toLocaleString('id-ID')} keberangkatan). Tingkat keterlambatan
              menunjukkan seberapa sering penerbangan terlambat, sedangkan durasi rata-rata hanya dihitung
              pada penerbangan yang terlambat. Perbedaan skala operasi dan periode turut memengaruhi perbandingan.
            </>
          : 'Data maskapai belum tersedia pada filter ini.'}
      </InsightCard>

      <div className="p-6 rounded-2xl bg-slate-900/85 border border-slate-800/80">
        <h3 className="text-base font-semibold text-white mb-4">
          Perbandingan Maskapai Berdasarkan {metricToggle === 'rate' ? 'Tingkat Keterlambatan (%)' : 'Durasi Rata-Rata Keterlambatan'}
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={carrierMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="code" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              />
              <Bar
                dataKey={metricToggle === 'rate' ? 'delayRate' : 'avgDelay'}
                name={metricToggle === 'rate' ? 'Delay Rate (%)' : 'Avg Delay (Mnt)'}
                radius={[4, 4, 0, 0]}
              >
                {carrierMetrics.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="#06b6d4"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/85 border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">Matriks Detail Maskapai</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              aria-label="Cari kode atau nama maskapai"
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
                <th className="py-3 px-3">Kode & Nama dalam Referensi</th>
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
                    <span className="font-semibold text-slate-300">
                      {c.delayRate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {c.avgDelay == null ? 'Tidak ada penerbangan terlambat' : `${c.avgDelay} mnt`}
                  </td>
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
        <InsightCard title="Cakupan nama carrier">
          CSV memuat {carrierCodes.size} kode carrier; referensi lokal mengenali {namedCarrierCount} di antaranya.
          Untuk {carrierCodes.size - namedCarrierCount} kode lain, nama operator tidak tersedia pada kolom dataset
          maupun kamus lokal dan tidak ditebak. Setiap nilai merupakan agregat bulanan per kode carrier dan rute.
          Estimasi biaya pada mode analis memakai asumsi FAA, bukan kerugian aktual yang tercatat.
        </InsightCard>
      </div>
    </div>
  );
};