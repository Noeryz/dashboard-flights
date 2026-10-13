import React, { useMemo } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { Compass, DollarSign, Plane, Clock3, Building2 } from 'lucide-react';

export const ExecutiveInsightsPanel: React.FC = () => {
  const { getCalculatedKPIs, getFilteredRows } = useFlightStore();
  const kpis = getCalculatedKPIs();
  const rows = getFilteredRows();

  const analysis = useMemo(() => {
    const factorTotals: Record<string, number> = {
      'Keterlambatan lanjutan pesawat': 0,
      'Sistem navigasi udara (NAS)': 0,
      'Operasional maskapai': 0,
      Cuaca: 0,
      Keamanan: 0,
    };
    const airportTotals: Record<string, { departures: number; delayedFlights: number }> = {};

    rows.forEach((row) => {
      factorTotals['Keterlambatan lanjutan pesawat'] += Number(row.LATE_AIRCRAFT_DELAY_MINUTES) || 0;
      factorTotals['Sistem navigasi udara (NAS)'] += Number(row.NAS_DELAY_MINUTES) || 0;
      factorTotals['Operasional maskapai'] += Number(row.CARRIER_DELAY_MINUTES) || 0;
      factorTotals.Cuaca += Number(row.WEATHER_DELAY_MINUTES) || 0;
      factorTotals.Keamanan += Number(row.SECURITY_DELAY_MINUTES) || 0;

      const origin = String(row.ORIGIN || '').trim();
      if (!origin) return;
      const airport = airportTotals[origin] ?? { departures: 0, delayedFlights: 0 };
      airport.departures += Number(row.DEPARTURES_PERFORMED) || 0;
      airport.delayedFlights += Number(row.ARR_DELAY_FLIGHTS) || 0;
      airportTotals[origin] = airport;
    });

    const factors = Object.entries(factorTotals)
      .filter(([, minutes]) => minutes > 0)
      .sort((a, b) => b[1] - a[1]);
    const categoryTotal = Object.values(factorTotals).reduce((sum, minutes) => sum + minutes, 0);
    const airports = Object.entries(airportTotals);
    const busiestAirport = airports.reduce<typeof airports[number] | null>(
      (busiest, airport) => !busiest || airport[1].departures > busiest[1].departures
        ? airport
        : busiest,
      null,
    );
    const highestDelayAirport = airports
      .filter(([, airport]) => airport.departures >= 1000)
      .reduce<typeof airports[number] | null>(
        (highest, airport) => !highest
          || airport[1].delayedFlights / airport[1].departures
            > highest[1].delayedFlights / highest[1].departures
          ? airport
          : highest,
        null,
      );
    const totalDepartures = airports.reduce((sum, [, airport]) => sum + airport.departures, 0);
    const totalDelayedFlights = airports.reduce((sum, [, airport]) => sum + airport.delayedFlights, 0);
    return {
      leadingFactor: factors[0],
      factors: factors.map(([name, minutes]) => ({
        name,
        minutes,
        share: categoryTotal > 0
          ? (minutes / categoryTotal) * 100
          : 0,
      })),
      categoryTotal,
      busiestAirport,
      busiestAirportShare: busiestAirport && totalDepartures > 0
        ? (busiestAirport[1].departures / totalDepartures) * 100
        : 0,
      busiestAirportDelayRate: busiestAirport && busiestAirport[1].departures > 0
        ? (busiestAirport[1].delayedFlights / busiestAirport[1].departures) * 100
        : 0,
      highestDelayAirport,
      networkDelayRate: totalDepartures > 0
        ? (totalDelayedFlights / totalDepartures) * 100
        : 0,
    };
  }, [rows]);

  const leadingAirportDelayRate = analysis.highestDelayAirport
    ? (analysis.highestDelayAirport[1].delayedFlights / analysis.highestDelayAirport[1].departures) * 100
    : null;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl cockpit-card-cyan flex items-center gap-3 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-400/50 bg-cyan-500/20 p-3 text-cyan-400">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Wawasan Operasional</h2>
            <p className="text-xs text-slate-300">Tiga pola utama pada filter aktif</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-3xl cockpit-card-normal space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
            <Clock3 className="h-4 w-4" /> Sumber menit delay
          </div>
          {analysis.factors.length > 0 ? (
            <>
              <div>
                <p className="text-2xl font-black text-white">{analysis.factors[0].share.toFixed(1)}%</p>
                <p className="text-xs text-slate-300">{analysis.factors[0].name}</p>
              </div>
              <div className="space-y-2.5" aria-label="Bagian total menit keterlambatan tiap kategori">
                {analysis.factors.map((factor, index) => (
                  <div key={factor.name}>
                    <div className="mb-1 flex justify-between gap-2 text-[10px] text-slate-300">
                      <span className="truncate">{factor.name}</span>
                      <span className="shrink-0 font-mono">{factor.share.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-950/80">
                      <div
                        className={`h-full rounded-full ${index === 0 ? 'bg-cyan-300' : 'bg-slate-500'}`}
                        style={{ width: `${factor.share}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="border-t border-slate-700/70 pt-3 text-[11px] leading-relaxed text-slate-400">
                Ini adalah menit yang tercatat pada kategori, bukan bukti penyebab awal setiap delay.
              </p>
            </>
          ) : <p className="text-xs text-slate-400">Belum ada menit kategori yang tercatat pada filter ini.</p>}
        </article>

        <article className="rounded-3xl cockpit-card-normal space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
            <Plane className="h-4 w-4" /> Frekuensi ≠ durasi
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-rose-400/20 bg-rose-950/25 p-3">
              <p className="text-[10px] uppercase text-slate-400">Keberangkatan terlambat</p>
              <p className="mt-1 font-mono text-2xl font-bold text-rose-300">{kpis.delayRate}%</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/25 p-3">
              <p className="text-[10px] uppercase text-slate-400">Rata-rata tercatat</p>
              <p className="mt-1 font-mono text-2xl font-bold text-cyan-200">
                {kpis.avgDelayMinutes == null ? '—' : `${kpis.avgDelayMinutes}`}
                {kpis.avgDelayMinutes != null && <span className="ml-1 text-xs">mnt</span>}
              </p>
            </div>
          </div>
          <p className="border-t border-slate-700/70 pt-3 text-[11px] leading-relaxed text-slate-400">
            Rate = frekuensi; menit = durasi teramati. Baris tanpa menit delay tidak masuk rata-rata.
          </p>
        </article>

        <article className="rounded-3xl cockpit-card-normal space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-100">
            <Building2 className="h-4 w-4" /> Volume dan keterlambatan bandara
          </div>
          {analysis.busiestAirport ? (
            <>
              <div>
                <p className="text-xs text-slate-400">Keberangkatan terbanyak</p>
                <p className="mt-1 font-mono text-2xl font-bold text-white">{analysis.busiestAirport[0]}</p>
                <p className="text-xs text-slate-300">{analysis.busiestAirportShare.toFixed(1)}% dari keberangkatan · delay {analysis.busiestAirportDelayRate.toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-950/55 p-3">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Rata-rata jaringan</span><span className="font-mono text-slate-200">{analysis.networkDelayRate.toFixed(1)}%</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                  {analysis.highestDelayAirport && (
                    <>
                      <span>Persentase delay tertinggi*</span>
                      <strong className="font-mono text-rose-300">{analysis.highestDelayAirport[0]} · {leadingAirportDelayRate?.toFixed(1)}%</strong>
                    </>
                  )}
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Persentase delay menunjukkan proporsi penerbangan terlambat, bukan jumlah kejadian.
                {analysis.highestDelayAirport && ' *Perbandingan hanya untuk bandara dengan sedikitnya 1.000 keberangkatan.'}
              </p>
            </>
          ) : <p className="text-xs text-slate-400">Volume bandara tidak tersedia pada filter ini.</p>}
        </article>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl cockpit-card-normal px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rose-200">
          <DollarSign className="h-4 w-4" /> Estimasi biaya delay
        </div>
        <p className="font-mono text-xl font-bold text-white">
          ${(kpis.totalEconomicCostUSD / 1000000).toFixed(1)} juta USD
        </p>
        <p className="text-[11px] text-slate-400">Asumsi FAA APO-100 · bukan biaya aktual</p>
      </section>
    </div>
  );
};
