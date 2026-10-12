import React from 'react';
import { useMemo } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { Compass, DollarSign, AlertCircle, Building2 } from 'lucide-react';
import { InsightCard } from './InsightCard';

export const ExecutiveInsightsPanel: React.FC = () => {
  const { getCalculatedKPIs, getFilteredRows } = useFlightStore();
  const kpis = getCalculatedKPIs();
  const rows = getFilteredRows();
  const { leadingFactor, busiestAirport } = useMemo(() => {
    const factorTotals: Record<string, number> = {
      'Rotasi pesawat': 0,
      'Sistem navigasi udara (NAS)': 0,
      'Operasional maskapai': 0,
      Cuaca: 0,
      Keamanan: 0,
    };
    const airportTotals: Record<string, number> = {};
    rows.forEach((row) => {
      factorTotals['Rotasi pesawat'] += Number(row.LATE_AIRCRAFT_DELAY_MINUTES) || 0;
      factorTotals['Sistem navigasi udara (NAS)'] += Number(row.NAS_DELAY_MINUTES) || 0;
      factorTotals['Operasional maskapai'] += Number(row.CARRIER_DELAY_MINUTES) || 0;
      factorTotals.Cuaca += Number(row.WEATHER_DELAY_MINUTES) || 0;
      factorTotals.Keamanan += Number(row.SECURITY_DELAY_MINUTES) || 0;
      const origin = String(row.ORIGIN || '').trim();
      if (origin) airportTotals[origin] = (airportTotals[origin] || 0) + (Number(row.DEPARTURES_PERFORMED) || 0);
    });
    return {
      leadingFactor: Object.entries(factorTotals).sort((a, b) => b[1] - a[1])[0],
      busiestAirport: Object.entries(airportTotals).sort((a, b) => b[1] - a[1])[0],
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl cockpit-card-cyan flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">Ringkasan Wawasan Operasional</h2>
            <p className="text-xs text-slate-300">
              Penjelasan langsung dan jawaban eksekutif terkait kondisi penerbangan
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl cockpit-card-normal space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold">
            <DollarSign className="w-4 h-4" /> BIAYA KERUGIAN KETERLAMBATAN
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            ${(kpis.totalEconomicCostUSD / 1000000).toFixed(1)} Juta USD
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Estimasi total kerugian akibat waktu tunda pesawat dan penumpang berdasarkan standar FAA APO-100 ($111,68/menit).
          </p>
        </div>

        <div className="p-6 rounded-3xl cockpit-card-normal space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
            <AlertCircle className="w-4 h-4" /> PENYEBAB UTAMA DELAY
          </div>
          <p className="text-lg font-bold font-mono text-amber-300">{leadingFactor?.[0] ?? 'Tidak ada data'}</p>
          <p className="text-xs text-slate-300 leading-relaxed">
            {leadingFactor
              ? `${leadingFactor[1].toLocaleString('id-ID')} menit delay tercatat untuk faktor ini pada cakupan filter aktif.`
              : 'Tidak ada menit delay yang tercatat pada filter aktif.'}
          </p>
        </div>

        <div className="p-6 rounded-3xl cockpit-card-normal space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
            <Building2 className="w-4 h-4" /> KEPADATAN HUB UTAMA
          </div>
          <p className="text-lg font-bold font-mono text-cyan-300">{busiestAirport?.[0] ?? 'Tidak ada data'}</p>
          <p className="text-xs text-slate-300 leading-relaxed">
            {busiestAirport
              ? `${busiestAirport[1].toLocaleString('id-ID')} keberangkatan pada filter aktif. Volume tinggi menunjukkan skala operasi, bukan bukti bahwa bandara tersebut memiliki delay tertinggi.`
              : 'Tidak ada volume keberangkatan pada filter aktif.'}
          </p>
        </div>
      </div>
      <InsightCard title="Interpretasi untuk pengambil keputusan">
        Estimasi biaya menggunakan asumsi biaya per menit yang dijelaskan pada metodologi dan tidak sama dengan
        kerugian finansial aktual. Prioritaskan tindak lanjut dengan membaca volume, delay rate, durasi, serta
        komposisi faktor secara bersamaan; angka agregat tidak cukup untuk menetapkan sebab-akibat.
      </InsightCard>
    </div>
  );
};