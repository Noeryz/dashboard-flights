import React from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { Compass, DollarSign, AlertCircle, Building2 } from 'lucide-react';

export const ExecutiveInsightsPanel: React.FC = () => {
  const { getCalculatedKPIs, filters } = useFlightStore();
  const kpis = getCalculatedKPIs();

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
          <p className="text-lg font-bold font-mono text-amber-300">
            Rotasi Pesawat (Late Aircraft)
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Efek domino keterlambatan pesawat dari penerbangan sebelumnya menjadi penyumbang terbesar durasi tunda nasional.
          </p>
        </div>

        <div className="p-6 rounded-3xl cockpit-card-normal space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
            <Building2 className="w-4 h-4" /> KEPADATAN HUB UTAMA
          </div>
          <p className="text-lg font-bold font-mono text-cyan-300">
            Atlanta (ATL) & Chicago (ORD)
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Bandara hub terbesar menangani volume penerbangan tertinggi sehingga lebih sensitif terhadap penumpukan jadwal.
          </p>
        </div>
      </div>
    </div>
  );
};