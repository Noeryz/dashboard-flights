import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, BrainCircuit, Network, Waves } from 'lucide-react';
import { useFlightStore } from '../../store/useFlightStore';
import { InsightCard } from './InsightCard';
import { analyzeFlights, type CorrelationResult, type SegmentationResult } from '../../utils/flightAnalytics';

const formatProbability = (value: number): string =>
  value < 0.001 ? 'p < 0,001' : `p = ${value.toLocaleString('id-ID', { maximumFractionDigits: 3 })}`;

const strengthDescription = (rho: number): string => {
  const strength = Math.abs(rho) < 0.2
    ? 'sangat lemah'
    : Math.abs(rho) < 0.4
      ? 'lemah'
      : Math.abs(rho) < 0.6
        ? 'sedang'
        : Math.abs(rho) < 0.8
          ? 'kuat'
          : 'sangat kuat';
  const direction = rho > 0 ? 'searah' : rho < 0 ? 'berlawanan arah' : 'tidak menunjukkan arah';
  return `${strength} dan ${direction}`;
};

const CorrelationCard: React.FC<{
  title: string;
  result: CorrelationResult | null;
  xKey: 'logDepartures' | 'loadFactor';
  xLabel: string;
  explanation: string;
}> = ({ title, result, xKey, xLabel, explanation }) => (
  <section className="space-y-4 rounded-3xl cockpit-card-normal p-5">
    <div>
      <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-white">{title}</h3>
      <p className="mt-1 text-xs text-slate-400">
        Setiap titik adalah satu bandara asal; rata-rata delay dihitung dari total menit ÷ jumlah penerbangan terlambat.
      </p>
    </div>
    {result ? (
      <>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 16, bottom: 18, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey={xKey}
                name={xLabel}
                type="number"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                label={{ value: xLabel, position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
              />
              <YAxis
                dataKey="averageDelay"
                name="Rata-rata delay"
                type="number"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                unit=" mnt"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#020617', borderColor: '#06b6d4', borderRadius: '12px', fontSize: '11px' }}
                formatter={(value, name) => [
                  name === 'Rata-rata delay'
                    ? `${Number(value).toFixed(1)} menit`
                    : Number(value).toLocaleString('id-ID'),
                  name,
                ]}
                labelFormatter={(_, payload) => payload[0]?.payload?.code || ''}
              />
              <Scatter data={result.points} fill="#22d3ee" fillOpacity={0.55} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] uppercase text-slate-400">Spearman ρ</p>
            <p className="mt-1 font-mono text-xl font-bold text-cyan-300">{result.rho.toFixed(3)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] uppercase text-slate-400">Signifikansi aproksimasi</p>
            <p className="mt-1 font-mono text-xl font-bold text-violet-300">{formatProbability(result.pValue)}</p>
          </div>
        </div>
        <InsightCard title="Interpretasi korelasi">
          Hubungan yang teramati {strengthDescription(result.rho)} (ρ = {result.rho.toFixed(3)};{' '}
          {formatProbability(result.pValue)}) pada {result.sampleSize.toLocaleString('id-ID')} bandara
          dengan sedikitnya 1.000 keberangkatan pada filter aktif. Nilai ρ menggambarkan keselarasan
          peringkat, bukan besarnya perubahan menit dan bukan bukti bahwa volume menyebabkan delay.
          {` ${explanation}`}
        </InsightCard>
      </>
    ) : (
      <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
        Sampel belum cukup untuk korelasi pada filter aktif. Pilih rentang tahun/bulan atau maskapai yang lebih luas.
      </p>
    )}
  </section>
);

const ClusterCards: React.FC<{ result: SegmentationResult; unit: string }> = ({ result, unit }) => (
  <div className="grid gap-3 md:grid-cols-3">
    {result.clusters.map((cluster) => (
      <article key={cluster.id} className="rounded-2xl border border-slate-800 bg-slate-950/65 p-4">
        <p className="font-mono text-[10px] uppercase tracking-wide text-violet-300">
          Segmen {cluster.id + 1} · {cluster.label}
        </p>
        <p className="mt-2 text-2xl font-bold text-white">
          {cluster.count.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">{unit}</span>
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
          <dt className="text-slate-400">Keberangkatan</dt>
          <dd className="text-right text-slate-200">{cluster.departures.toLocaleString('id-ID')}</dd>
          <dt className="text-slate-400">Rata-rata delay</dt>
          <dd className="text-right text-rose-300">{cluster.averageDelay.toFixed(1)} mnt</dd>
          <dt className="text-slate-400">Delay rate</dt>
          <dd className="text-right text-amber-300">{cluster.delayRate.toFixed(1)}%</dd>
          <dt className="text-slate-400">Load factor</dt>
          <dd className="text-right text-cyan-300">{cluster.loadFactor.toFixed(1)}%</dd>
          <dt className="text-slate-400">Pembatalan</dt>
          <dd className="text-right text-slate-200">{cluster.cancellationRate.toFixed(2)}%</dd>
        </dl>
      </article>
    ))}
  </div>
);

export const RelationshipsPanel: React.FC = () => {
  const { rawRows, filters } = useFlightStore();
  const [segmentTarget, setSegmentTarget] = useState<'airport' | 'carrier'>('airport');
  const filteredRows = useMemo(
    () => rawRows.filter((row) =>
      (filters.year === 'ALL' || String(row.YEAR || '') === filters.year) &&
      (filters.month === 'ALL' || String(row.MONTH || '') === filters.month) &&
      (filters.carrier === 'ALL' || String(row.UNIQUE_CARRIER || '').trim().toUpperCase() === filters.carrier),
    ),
    [rawRows, filters.year, filters.month, filters.carrier],
  );
  const analysis = useMemo(
    () => analyzeFlights(filteredRows, rawRows),
    [filteredRows, rawRows],
  );
  const segments = segmentTarget === 'airport' ? analysis.airportSegments : analysis.carrierSegments;
  const model = analysis.delayModel;
  const summer = analysis.seasonality;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl cockpit-card-cyan p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/15 p-3 text-cyan-300">
            <Network className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold uppercase tracking-wide text-white">Analisis Hubungan, Prediksi & Segmentasi</h2>
            <p className="mt-1 text-xs text-slate-300">
              Menguji pola traffic–delay, perubahan musiman, daya prediksi data agregat, dan kelompok profil operasional.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-2">
        <CorrelationCard
          title="H1 · Volume traffic ↔ rata-rata delay"
          result={analysis.trafficDelay}
          xKey="logDepartures"
          xLabel="Log10 keberangkatan total"
          explanation="Sumbu horizontal menggunakan log untuk membantu membaca sebaran traffic yang sangat timpang; pengujian peringkat Spearman tetap mempertahankan urutan traffic."
        />
        <CorrelationCard
          title="H2 · Load factor ↔ rata-rata delay"
          result={analysis.loadDelay}
          xKey="loadFactor"
          xLabel="Load factor (%)"
          explanation="Load factor dihitung sebagai total penumpang ÷ total kursi. Agregasi ini mengukur asosiasi antarabandara, bukan efek pada satu penerbangan."
        />
      </section>

      <section className="rounded-3xl cockpit-card-normal p-5">
        <div className="mb-4 flex items-center gap-2">
          <Waves className="h-5 w-5 text-amber-300" />
          <div>
            <h3 className="font-mono text-sm font-bold uppercase text-white">H3 · Musim liburan musim panas</h3>
            <p className="text-xs text-slate-400">Perbandingan Juni–Agustus terhadap bulan lain; unit uji adalah bandara, dipasangkan.</p>
          </div>
        </div>
        {summer ? (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { season: 'Juni–Agustus', delay: summer.summerAverageDelay },
                    { season: 'Bulan lainnya', delay: summer.otherAverageDelay },
                  ]}
                  margin={{ top: 8, right: 16, bottom: 8, left: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="season" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={10} unit=" mnt" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#f59e0b', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(value) => [`${Number(value).toFixed(1)} menit`, 'Rata-rata per bandara']}
                  />
                  <Bar dataKey="delay" name="Rata-rata delay" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <InsightCard title="Temuan musiman">
              Rata-rata delay per bandara pada Juni–Agustus adalah {summer.summerAverageDelay.toFixed(1)} menit,
              dibanding {summer.otherAverageDelay.toFixed(1)} menit pada bulan lain
              ({summer.difference >= 0 ? '+' : ''}{summer.difference.toFixed(1)} menit). Uji t berpasangan
              eksploratif: {formatProbability(summer.pValue)}, {summer.sampleSize.toLocaleString('id-ID')} bandara.
              Tahun hanya 2024–2025 dan bulan mewakili musim (bukan tanggal libur per penerbangan); hasil belum
              membuktikan sebab-akibat atau pola yang berlaku di tahun lain.
            </InsightCard>
          </>
        ) : (
          <p className="text-xs text-amber-200">Perbandingan musim memerlukan bulan musim panas dan bulan lain sekaligus pada filter aktif.</p>
        )}
      </section>

      <section className="rounded-3xl cockpit-card-cyan p-5">
        <div className="mb-4 flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-cyan-300" />
          <div>
            <h3 className="font-mono text-sm font-bold uppercase text-white">Model estimasi rata-rata delay</h3>
            <p className="text-xs text-slate-300">
              Ridge regression · holdout kronologis Oktober–Desember 2025 · sasaran: menit delay pada baris agregat carrier–rute–bulan.
            </p>
          </div>
        </div>
        {model ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Baris latih', model.trainingRows.toLocaleString('id-ID')],
                ['Baris uji', model.testRows.toLocaleString('id-ID')],
                ['MAE model', `${model.mae.toFixed(1)} menit`],
                ['MAE baseline median', `${model.baselineMae.toFixed(1)} menit`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase text-slate-400">{label}</p>
                  <p className="mt-1 font-mono text-lg font-bold text-cyan-200">{value}</p>
                </div>
              ))}
            </div>
            <InsightCard title="Kinerja dan batas model">
              Model menggunakan volume keberangkatan, rasio penumpang/kursi, pembatalan, jarak, dan bulan.
              MAE menyatakan selisih absolut rata-rata terhadap data uji; R² = {model.rSquared.toFixed(3)}.
              {model.mae < model.baselineMae
                ? ` MAE model ${((1 - model.mae / model.baselineMae) * 100).toFixed(1)}% lebih rendah dari baseline median pada holdout ini.`
                : ' Model belum mengungguli baseline median pada holdout ini.'}
              {' '}R² yang tidak positif berarti model belum menjelaskan variasi data uji dengan baik.
              Ini estimasi eksploratif untuk agregat bulanan, bukan prediksi delay/pembatalan penerbangan individual;
              data tidak memiliki waktu keberangkatan aktual, cuaca, atau identitas penerbangan.
            </InsightCard>
          </>
        ) : (
          <p className="text-xs text-amber-200">Model memerlukan data latih pra-Oktober 2025 dan set uji Q4 2025 yang cukup.</p>
        )}
      </section>

      <section className="space-y-4 rounded-3xl cockpit-card-normal p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-violet-300" />
            <div>
              <h3 className="font-mono text-sm font-bold uppercase text-white">Segmentasi k-means (3 kelompok)</h3>
              <p className="text-xs text-slate-400">Fitur: log traffic, rata-rata delay, load factor, dan cancellation rate.</p>
            </div>
          </div>
          <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setSegmentTarget('airport')}
              className={`rounded-lg px-3 py-1.5 text-xs ${segmentTarget === 'airport' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400'}`}
            >
              Bandara
            </button>
            <button
              type="button"
              onClick={() => setSegmentTarget('carrier')}
              className={`rounded-lg px-3 py-1.5 text-xs ${segmentTarget === 'carrier' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400'}`}
            >
              Maskapai
            </button>
          </div>
        </div>
        <ClusterCards result={segments} unit={segmentTarget === 'airport' ? 'bandara' : 'maskapai'} />
        <InsightCard title="Cara membaca segmentasi">
          K-means mengelompokkan profil serupa setelah tiap metrik distandarkan; nama kelompok dijelaskan dari
          traffic dan rata-rata delay relatif terhadap kelompok lain. Ini pengelompokan deskriptif, bukan peringkat
          performa maupun bukti bahwa anggota satu kelompok memiliki penyebab delay yang sama. Filter global
          memengaruhi data segmentasi; model prediksi di atas selalu memakai pembagian waktu penuh agar holdout tetap konsisten.
        </InsightCard>
      </section>
    </div>
  );
};
