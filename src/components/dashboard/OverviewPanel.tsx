import React, { useMemo, useState, useEffect } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { MONTH_NAMES_FULL, MONTH_NAMES_SHORT } from '../../utils/constants';
import {
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
} from '../../utils/chartStyles';
import { InsightCard } from './InsightCard';
import {
  Activity,
  Users,
  Clock,
  AlertTriangle,
  Percent,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  DollarSign,
  ZoomIn,
  ZoomOut,
  Maximize2,
  HelpCircle,
} from 'lucide-react';
import {
  Area,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { getCarrierDisplayName } from '../../utils/referenceData';

interface ActiveMonthDotProps {
  cx?: number;
  cy?: number;
  index?: number;
  activeMonth: number | null;
}

const ActiveMonthDot: React.FC<ActiveMonthDotProps> = ({ cx, cy, index = -1, activeMonth }) => {
  if (cx == null || cy == null) return null;

  const isCurrentActive = activeMonth !== null && index === activeMonth - 1;

  return (
    <circle
      key={`dot-${index}`}
      cx={cx}
      cy={cy}
      r={isCurrentActive ? 4.5 : 3}
      fill={isCurrentActive ? '#67e8f9' : '#0f172a'}
      stroke="#67e8f9"
      strokeWidth={1.5}
    />
  );
};

export const OverviewPanel: React.FC = () => {
  const { getCalculatedKPIs, getFilteredRows, rawRows, filters } = useFlightStore();
  const kpis = getCalculatedKPIs();
  const filteredRows = getFilteredRows();

  // State Simulasi Bulanan
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);

  // State Zoom Grafik Tren
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 11]);

  // Timer Simulasi Pergerakan Pesawat Meluncur Antarbulan
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveMonth((prev) => {
          if (prev === null || prev >= 12) return 1;
          return prev + 1;
        });
      }, 1200); // Bergerak pelan & stabil setiap 1.2 detik
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const dynamicTopCarriers = useMemo(() => {
    const carrierMap: Record<string, number> = {};
    filteredRows.forEach((r) => {
      if (activeMonth !== null && Number(r.MONTH) !== activeMonth) return;

      const c = String(r.UNIQUE_CARRIER || 'LAINNYA').trim().toUpperCase();
      carrierMap[c] = (carrierMap[c] || 0) + Number(r.DEPARTURES_PERFORMED || 0);
    });

    return Object.entries(carrierMap)
      .map(([carrier, flights]) => ({ carrier, flights }))
      .sort((a, b) => b.flights - a.flights)
      .slice(0, 8);
  }, [filteredRows, activeMonth]);

  const fullMonthlyTrend = useMemo(() => {
    const monthStats: Record<number, { volume: number; delayedFlights: number }> = {};
    for (let m = 1; m <= 12; m++) monthStats[m] = { volume: 0, delayedFlights: 0 };

    rawRows.forEach((r) => {
      if (filters.year !== 'ALL' && String(r.YEAR) !== filters.year) return;
      if (filters.carrier !== 'ALL' && String(r.UNIQUE_CARRIER || '').trim().toUpperCase() !== filters.carrier) return;
      const m = Number(r.MONTH || 1);

      if (monthStats[m]) {
        monthStats[m].volume += Number(r.DEPARTURES_PERFORMED || 0);
        monthStats[m].delayedFlights += Number(r.ARR_DELAY_FLIGHTS || 0);
      }
    });

    return Object.entries(monthStats).map(([mStr, stats]) => {
      const mNum = Number(mStr);
      return {
        monthNum: mNum,
        monthFull: MONTH_NAMES_FULL[mNum - 1],
        monthShort: MONTH_NAMES_SHORT[mNum - 1],
        volume: stats.volume,
        delayedFlights: stats.delayedFlights,
        delayRate: stats.volume > 0 ? Number(((stats.delayedFlights / stats.volume) * 100).toFixed(1)) : null,
      };
    });
  }, [rawRows, filters.year, filters.carrier]);

  const visibleMonthlyTrend = useMemo(() => {
    return fullMonthlyTrend.slice(zoomRange[0], zoomRange[1] + 1);
  }, [fullMonthlyTrend, zoomRange]);
  const peakMonth = visibleMonthlyTrend.reduce(
    (peak, month) => month.volume > peak.volume ? month : peak,
    visibleMonthlyTrend[0] ?? { monthFull: '—', monthShort: '—', volume: 0, delayedFlights: 0, delayRate: null, monthNum: 0 },
  );
  const quietMonth = visibleMonthlyTrend.reduce(
    (quiet, month) => month.volume < quiet.volume ? month : quiet,
    visibleMonthlyTrend[0] ?? { monthFull: '—', monthShort: '—', volume: 0, delayedFlights: 0, delayRate: null, monthNum: 0 },
  );
  const highestMonthlyDelayRate = visibleMonthlyTrend
    .filter((month) => month.volume > 0 && month.delayRate !== null)
    .reduce<(typeof visibleMonthlyTrend)[number] | null>(
      (highest, month) => !highest || (month.delayRate ?? 0) > (highest.delayRate ?? 0) ? month : highest,
      null,
    );
  const busiestCarrier = dynamicTopCarriers[0];

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 2.5));
    setZoomRange(([start, end]) => {
      if (end - start <= 3) return [start, end];
      return [start + 1, end - 1];
    });
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
    setZoomRange(([start, end]) => [Math.max(0, start - 1), Math.min(11, end + 1)]);
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setZoomRange([0, 11]);
  };

  const handleFitZoom = () => {
    setZoomLevel(1.8);
    setZoomRange([4, 8]);
  };

  const formatNum = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)} Juta`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)} Ribu`;
    return num.toLocaleString('id-ID');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl cockpit-card-cyan p-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-cyan-300" />
          <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white">Rumusan Masalah</h2>
        </div>
        <div className="mt-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-cyan-200">Problem Statement</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Bagaimana distribusi ketepatan waktu (delay) dan volume penerbangan antar maskapai, bandara, dan bulan, serta kategori keterlambatan mana yang mencatat menit delay terbanyak?
            </p>
          </div>
        </div>
        <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-400">
          Filter tahun, bulan, dan maskapai mengubah semua angka pada ringkasan.
        </p>
      </section>

      {/* 6 KARTU RINGKASAN UTAMA */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl cockpit-card-cyan">
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase">
            <span>Total Penerbangan</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-xl font-black font-mono text-white mt-2">{formatNum(kpis.totalFlights)}</p>
        </div>

        <div className="p-4 rounded-2xl cockpit-card-normal">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 font-bold uppercase">
            <span>Total Penumpang</span>
            <Users className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-xl font-black font-mono text-slate-100 mt-2">{formatNum(kpis.totalPassengers)}</p>
        </div>

        <div className="p-4 rounded-2xl cockpit-card-rose">
          <div className="flex items-center justify-between text-[10px] font-mono text-rose-400 font-bold uppercase">
            <span>Tingkat Keterlambatan</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="text-xl font-black font-mono text-rose-400 mt-2">{kpis.delayRate}%</p>
        </div>

        <div className="p-4 rounded-2xl cockpit-card-normal">
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase">
            <span>Rata-Rata Delay</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-xl font-black font-mono text-cyan-300 mt-2">
            {kpis.avgDelayMinutes == null ? 'Tidak tersedia' : `${kpis.avgDelayMinutes} mnt`}
          </p>
        </div>

        <div className="p-4 rounded-2xl cockpit-card-normal">
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase">
            <span>Tingkat Pembatalan</span>
            <Percent className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-xl font-black font-mono text-amber-400 mt-2">{kpis.cancelRate}%</p>
        </div>

        <div className="p-4 rounded-2xl cockpit-card-normal">
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold uppercase">
            <span>Seat Load Factor</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-black font-mono text-emerald-400 mt-2">{kpis.seatLoadFactor}%</p>
        </div>
      </div>

      <InsightCard title="Cara membaca ringkasan">
        Delay rate = frekuensi; rata-rata menit = durasi pada catatan yang memiliki menit teramati. Pembatalan
        dibandingkan dengan jadwal, load factor membandingkan penumpang dengan kursi. Data berupa agregat bulanan,
        bukan catatan tiap penerbangan.
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-3xl cockpit-card-cyan p-6">
          <h3 className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-white">
            <DollarSign className="h-4 w-4 text-cyan-400" /> Estimasi biaya delay
          </h3>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/65 p-4 font-mono">
            <p className="text-2xl font-black text-rose-300">
              ${(kpis.totalEconomicCostUSD / 1000000000).toFixed(2)} miliar USD
            </p>
            <p className="mt-1 text-[10px] text-slate-400">Asumsi FAA APO-100 · bukan biaya aktual</p>
          </div>

          <div className="mt-3 border-t border-slate-700/70 pt-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Bulan dengan volume agregat tertinggi</p>
            <p className="mt-1 font-mono text-sm font-bold text-cyan-200">
              {peakMonth.monthFull} <span className="font-normal text-slate-300">· {formatNum(peakMonth.volume)}</span>
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Terendah: {quietMonth.monthFull} · {formatNum(quietMonth.volume)}. Total lintas tahun terpilih.
            </p>
          </div>
        </div>

        {/* GRAFIK TREN DENGAN IKON PESAWAT MELUNCUR */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl cockpit-card-normal space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
                  Volume penerbangan dan tingkat delay bulanan · {filters.year === 'ALL' ? '2024–2025' : filters.year}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {zoomLevel > 1 ? `Skala Zoom: ${(zoomLevel * 100).toFixed(0)}%` : 'Tampilan Utama 100%'}
                </p>
              </div>

              {/* TOOLBAR INTERAKTIF GRAFIK */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-cyan-500/30 transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? 'Jeda' : 'Simulasi'}
                </button>

                <div className="h-4 w-[1px] bg-slate-800 mx-1" />

                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleFitZoom}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition cursor-pointer"
                  title="Fit Zoom (Musim Panas)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveMonth(null);
                    handleResetZoom();
                  }}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition cursor-pointer"
                  title="Kembali ke Axis Utama"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* BAR STATUS BULAN DIPILIH */}
            {activeMonth !== null && (
              <div className="px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-300 text-xs flex items-center justify-between">
                <span>
                  Bulan terpilih: <strong className="text-white">{MONTH_NAMES_FULL[activeMonth - 1]}</strong>
                </span>
              </div>
            )}

            {/* GRAFIK KURVA RECHARTS */}
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={visibleMonthlyTrend} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="monthShort"
                    interval={0}
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis yAxisId="volume" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="rate" orientation="right" stroke="#fda4af" fontSize={10} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                    labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                    itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                    formatter={(value, name) => [
                      name === 'Tingkat delay'
                        ? value == null ? 'Tidak tersedia' : `${Number(value).toFixed(1)}%`
                        : Number(value).toLocaleString('id-ID'),
                      name,
                    ]}
                    labelFormatter={(label) => {
                      const monthIndex = MONTH_NAMES_SHORT.indexOf(String(label));
                      return `Bulan: ${monthIndex >= 0 ? MONTH_NAMES_FULL[monthIndex] : label}`;
                    }}
                  />
                  <Area
                    yAxisId="volume"
                    type="monotone"
                    dataKey="volume"
                    name="Keberangkatan"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    dot={<ActiveMonthDot activeMonth={activeMonth} />}
                  />
                  <Line
                    yAxisId="rate"
                    type="monotone"
                    dataKey="delayRate"
                    name="Tingkat delay"
                    stroke="#fb7185"
                    strokeWidth={2}
                    connectNulls={false}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400">
              Area: jumlah keberangkatan (sumbu kiri). Garis: penerbangan terlambat dibagi keberangkatan (sumbu kanan). Grafik membandingkan semua bulan; filter bulan tidak diterapkan agar pola tahunan tetap terbaca.
            </p>
            <InsightCard title="Pola volume bulanan">
              Volume tertinggi terjadi pada {peakMonth.monthFull} ({formatNum(peakMonth.volume)} keberangkatan), sedangkan yang terendah pada {quietMonth.monthFull} ({formatNum(quietMonth.volume)}).
              {highestMonthlyDelayRate && <> Tingkat delay tertinggi tercatat pada {highestMonthlyDelayRate.monthFull}: {highestMonthlyDelayRate.delayRate?.toFixed(1)}% ({formatNum(highestMonthlyDelayRate.delayedFlights)} dari {formatNum(highestMonthlyDelayRate.volume)} keberangkatan).</>}
              {' '}Puncak volume dan puncak proporsi delay tidak selalu bertepatan. Perbandingan ini menunjukkan pola bulanan, bukan penyebab keterlambatan.
            </InsightCard>
          </div>

          {/* MASKAPAI TERATAS */}
          <div className="p-6 rounded-3xl cockpit-card-normal">
            <h3 className="text-xs font-bold text-slate-100 font-mono uppercase mb-1 tracking-wider">
              Maskapai teratas menurut volume {activeMonth ? `· ${MONTH_NAMES_FULL[activeMonth - 1]}` : ''}
            </h3>
            <p className="mb-3 text-[10px] text-slate-400">Delapan kode dengan keberangkatan terbanyak pada filter ini.</p>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicTopCarriers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="carrier" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                    labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                    itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                    formatter={(val) => [Number(val).toLocaleString('id-ID'), 'Jumlah Penerbangan']}
                    labelFormatter={(carrier) => getCarrierDisplayName(String(carrier))}
                  />
                  <Bar dataKey="flights" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                    {dynamicTopCarriers.map((_, idx) => (
                      <Cell key={idx} fill={idx === 0 ? '#10b981' : '#06b6d4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <InsightCard title="Temuan volume">
              {busiestCarrier
                ? `${busiestCarrier.carrier} memimpin delapan teratas dengan ${formatNum(busiestCarrier.flights)} keberangkatan. Volume mengukur skala, bukan mutu layanan.`
                : 'Belum ada data maskapai pada filter ini.'}
            </InsightCard>
          </div>
        </div>
      </div>
    </div>
  );
};