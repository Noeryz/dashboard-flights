import React, { useMemo, useState, useEffect } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { getDelayDurationObservation } from '../../utils/flightAnalytics';
import { MONTH_NAMES_FULL } from '../../utils/constants';
import {
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
} from '../../utils/chartStyles';
import { Building2, MapPin, Globe, Play, Pause, ZoomIn, ZoomOut, RotateCcw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
} from 'recharts';
import { InsightCard } from './InsightCard';

export const AirportPanel: React.FC = () => {
  const { getFilteredRows, rawRows, filters } = useFlightStore();
  const filteredRows = getFilteredRows();
  const airportCoverage = useMemo(() => {
    const origins = new Set(rawRows.map((row) => String(row.ORIGIN || '').trim().toUpperCase()).filter(Boolean));
    const destinations = new Set(rawRows.map((row) => String(row.DEST || '').trim().toUpperCase()).filter(Boolean));
    return { origins: origins.size, destinations: destinations.size };
  }, [rawRows]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [simulatedMonth, setSimulatedMonth] = useState<number | null>(null);
  const [zoomLimit, setZoomLimit] = useState<number>(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const airportStats = useMemo(() => {
    const originMap: Record<string, {
      flights: number;
      passengers: number;
      seats: number;
      delayed: number;
      delayMinutes: number;
      averageDelayFlights: number;
    }> = {};

    filteredRows.forEach((r) => {
      if (simulatedMonth !== null && Number(r.MONTH) !== simulatedMonth) return;

      const orig = String(r.ORIGIN || '').trim().toUpperCase();
      if (!orig) return;
      const flights = Number(r.DEPARTURES_PERFORMED || 0);
      const pax = Number(r.PASSENGERS || 0);

      if (!originMap[orig]) {
        originMap[orig] = {
          flights: 0,
          passengers: 0,
          seats: 0,
          delayed: 0,
          delayMinutes: 0,
          averageDelayFlights: 0,
        };
      }
      originMap[orig].flights += flights;
      originMap[orig].passengers += pax;
      originMap[orig].seats += Number(r.SEATS || 0);
      originMap[orig].delayed += Number(r.ARR_DELAY_FLIGHTS || 0);
      const durationObservation = getDelayDurationObservation(r);
      originMap[orig].delayMinutes += durationObservation.delayMinutes;
      originMap[orig].averageDelayFlights += durationObservation.delayedFlights;
    });

    return Object.entries(originMap)
      .map(([code, data]) => ({
        airport: code,
        flights: data.flights,
        delayedFlights: data.delayed,
        passengers: data.passengers,
        seats: data.seats,
        delayRate: data.flights > 0 ? (data.delayed / data.flights) * 100 : 0,
        averageDelay: data.averageDelayFlights > 0
          ? data.delayMinutes / data.averageDelayFlights
          : null,
      }))
      .sort((a, b) => b.flights - a.flights);
  }, [filteredRows, simulatedMonth]);

  const chartAirports = airportStats.slice(0, zoomLimit);
  const totalAirportFlights = airportStats.reduce((sum, airport) => sum + airport.flights, 0);
  const totalDelayedFlights = airportStats.reduce((sum, airport) => sum + airport.delayedFlights, 0);
  const networkDelayRate = totalAirportFlights > 0
    ? (totalDelayedFlights / totalAirportFlights) * 100
    : 0;
  const topAirport = airportStats[0];
  const highestDelayAirport = airportStats
    .filter((airport) => airport.flights >= 1000)
    .reduce<(typeof airportStats)[number] | null>(
      (highest, airport) => !highest || airport.delayRate > highest.delayRate ? airport : highest,
      null,
    );
  const searchedAirports = airportStats.filter((airport) =>
    airport.airport.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  );
  const totalPages = Math.max(1, Math.ceil(searchedAirports.length / itemsPerPage));
  const pageAirports = searchedAirports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl cockpit-card-cyan flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Aktivitas Bandara</h2>
            <p className="text-xs text-slate-300">
              {topAirport
                ? <>Volume tertinggi: <strong className="text-cyan-400 font-mono">{topAirport.airport}</strong> · {topAirport.flights.toLocaleString('id-ID')} keberangkatan</>
                : 'Data bandara tidak tersedia untuk filter ini.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-3xl cockpit-card-normal space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" /> Volume dan Delay Bandara Asal · {filters.year === 'ALL' ? '2024–2025' : filters.year}
              </h3>
              {simulatedMonth && (
                <p className="text-xs text-cyan-400 font-mono mt-0.5">📅 Bulan: {MONTH_NAMES_FULL[simulatedMonth - 1]}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? 'Jeda simulasi bulanan bandara' : 'Putar simulasi bulanan bandara'}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                Simulasi
              </button>

              <button
                type="button"
                onClick={() => setZoomLimit(5)}
                aria-label="Tampilkan lima bandara dengan volume tertinggi"
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 cursor-pointer"
                title="Zoom Top 5 Hub"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLimit(12)}
                aria-label="Tampilkan 12 bandara dengan volume tertinggi"
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 cursor-pointer"
                title="Tampilkan 12 Bandara"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLimit(25)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] font-mono text-slate-300 hover:text-cyan-400"
                title="Tampilkan 25 bandara teratas"
              >
                Top 25
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setSimulatedMonth(null);
                  setZoomLimit(12);
                }}
                aria-label="Reset tampilan bandara"
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 cursor-pointer"
                title="Reset Axis Utama"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartAirports}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="airport" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis yAxisId="volume" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis yAxisId="rate" orientation="right" stroke="#fda4af" fontSize={10} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                  labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                  itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                  formatter={(value, name) => [
                    name === 'Tingkat delay'
                      ? `${Number(value).toFixed(1)}%`
                      : Number(value).toLocaleString('id-ID'),
                    name,
                  ]}
                />
                <Bar yAxisId="volume" dataKey="flights" name="Keberangkatan" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                  {chartAirports.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#06b6d4'} />
                  ))}
                </Bar>
                <Line
                  yAxisId="rate"
                  dataKey="delayRate"
                  name="Tingkat delay"
                  type="monotone"
                  stroke="#fb7185"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400">
            Batang menunjukkan jumlah keberangkatan (sumbu kiri); garis menunjukkan proporsi penerbangan terlambat (sumbu kanan).
          </p>
          <InsightCard title="Volume dan proporsi delay">
            {topAirport
              ? `Dari ${totalAirportFlights.toLocaleString('id-ID')} keberangkatan pada jaringan yang difilter, ${totalDelayedFlights.toLocaleString('id-ID')} mengalami keterlambatan (${networkDelayRate.toFixed(1)}%). Angka ini adalah jumlah penerbangan terlambat dibagi seluruh keberangkatan, bukan persentase menit keterlambatan. ${topAirport.airport} menangani ${(totalAirportFlights > 0 ? (topAirport.flights / totalAirportFlights) * 100 : 0).toFixed(1)}% keberangkatan; ${topAirport.delayRate.toFixed(1)}% keberangkatannya terlambat, ${(topAirport.delayRate - networkDelayRate >= 0 ? 'lebih tinggi' : 'lebih rendah')} ${Math.abs(topAirport.delayRate - networkDelayRate).toFixed(1)} poin persentase dari tingkat jaringan.`
              : 'Belum ada baris bandara pada filter ini.'}{' '}
            {highestDelayAirport
              ? `Persentase keterlambatan tertinggi*: ${highestDelayAirport.airport} (${highestDelayAirport.delayRate.toFixed(1)}%).`
              : 'Belum ada bandara yang memenuhi ambang volume 1.000 keberangkatan untuk perbandingan tingkat delay.'}{' '}
            Grafik menampilkan {chartAirports.length} bandara asal dengan volume tertinggi dari {airportStats.length} bandara pada filter ini agar mudah dibaca.
            {' '}Dataset memuat {airportCoverage.origins.toLocaleString('id-ID')} bandara asal dan {airportCoverage.destinations.toLocaleString('id-ID')} bandara tujuan.
            {' '}Daftar di samping dapat dicari dan mencakup semua bandara asal pada filter. *Perbandingan delay memakai bandara dengan sedikitnya 1.000 keberangkatan.
          </InsightCard>
        </div>

        <div className="lg:col-span-4 p-6 rounded-3xl cockpit-card-normal space-y-4">
          <h3 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-400" /> Seluruh Bandara Asal
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              aria-label="Cari bandara asal"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari kode IATA..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white"
            />
          </div>
          <div className="space-y-2.5 font-mono text-xs">
            {pageAirports.map((item) => (
              <div key={item.airport} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400">{item.airport}</span>
                  <span className="text-slate-300">{item.flights.toLocaleString('id-ID')} keberangkatan</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  Delay {item.delayRate.toFixed(1)}% · rata-rata{' '}
                  {item.averageDelay == null ? 'tidak tersedia' : `${item.averageDelay.toFixed(1)} mnt`}
                  {' '}pada menit teramati · load {item.seats > 0 ? ((item.passengers / item.seats) * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>{searchedAirports.length.toLocaleString('id-ID')} bandara · halaman {currentPage}/{totalPages}</span>
            <div className="flex gap-1">
              <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded border border-slate-800 p-1 disabled:opacity-40">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button type="button" aria-label="Halaman berikutnya" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="rounded border border-slate-800 p-1 disabled:opacity-40">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};