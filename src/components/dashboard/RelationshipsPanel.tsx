import React, { useMemo } from 'react';
import { Network } from 'lucide-react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFlightStore } from '../../store/useFlightStore';
import { analyzeFlights, type CorrelationResult } from '../../utils/flightAnalytics';
import {
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
} from '../../utils/chartStyles';
import { InsightCard } from './InsightCard';

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
  const direction = rho > 0 ? 'searah' : rho < 0 ? 'berlawanan arah' : 'tanpa arah';
  return `${strength} dan ${direction}`;
};

const interpretRelationship = (rho: number, xLabel: string): string => {
  const metric = xLabel === 'Log10 keberangkatan'
    ? 'volume keberangkatan'
    : xLabel.replace(' (%)', '');
  if (Math.abs(rho) < 0.2) {
    return `Pola ${metric.toLowerCase()} hampir tidak sejalan dengan durasi delay pada sampel ini.`;
  }
  if (rho > 0) {
    return `Bandara dengan ${metric.toLowerCase()} lebih tinggi cenderung memiliki durasi delay lebih tinggi. Ini keterkaitan, bukan bukti sebab-akibat.`;
  }
  return `Bandara dengan ${metric.toLowerCase()} lebih tinggi cenderung memiliki durasi delay lebih rendah; faktor lain belum diuji.`;
};

const CorrelationCard: React.FC<{
  title: string;
  result: CorrelationResult | null;
  xKey: 'logDepartures' | 'loadFactor' | 'delayRate';
  xLabel: string;
}> = ({ title, result, xKey, xLabel }) => (
  <section className="space-y-4 rounded-3xl cockpit-card-normal p-5">
    <div>
      <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-white">{title}</h3>
      <p className="mt-1 text-xs text-slate-400">
        Satu titik = satu bandara asal (≥1.000 keberangkatan) · Y = menit delay teramati.
      </p>
    </div>
    {result ? (
      <>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 20, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey={xKey}
                name={xLabel}
                type="number"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                label={{ value: xLabel, position: 'insideBottom', offset: -16, fill: '#94a3b8', fontSize: 10 }}
              />
              <YAxis
                dataKey="averageDelay"
                name="Durasi rata-rata"
                type="number"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                unit=" mnt"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                formatter={(value, name) => [
                  name === 'Durasi rata-rata'
                    ? `${Number(value).toFixed(1)} menit`
                    : Number(value).toLocaleString('id-ID'),
                  name,
                ]}
                labelFormatter={(_, payload) => payload[0]?.payload?.code || ''}
              />
              <Scatter data={result.points} fill="#22d3ee" fillOpacity={0.68} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] uppercase text-slate-400">Korelasi Spearman (ρ)</p>
            <p className="mt-1 font-mono text-xl font-bold text-cyan-300">{result.rho.toFixed(3)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] uppercase text-slate-400">Bandara dianalisis</p>
            <p className="mt-1 font-mono text-xl font-bold text-violet-300">{result.sampleSize.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <InsightCard title={`${strengthDescription(result.rho)} · ρ ${result.rho.toFixed(3)}`}>
          {interpretRelationship(result.rho, xLabel)} Spearman membandingkan peringkat, bukan perubahan menit.
        </InsightCard>
      </>
    ) : (
      <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
        Sampel bandara belum cukup untuk menghitung korelasi pada filter aktif. Perlu sedikitnya tiga bandara dengan minimal 1.000 keberangkatan dan data keterlambatan.
      </p>
    )}
  </section>
);

export const RelationshipsPanel: React.FC = () => {
  const { getFilteredRows } = useFlightStore();
  const filteredRows = getFilteredRows();
  const analysis = useMemo(() => analyzeFlights(filteredRows), [filteredRows]);
  const strongestRelationship = [
    analysis.trafficDelay,
    analysis.delayRateDelay,
    analysis.loadDelay,
  ].reduce<CorrelationResult | null>(
    (strongest, result) => result && (!strongest || Math.abs(result.rho) > Math.abs(strongest.rho))
      ? result
      : strongest,
    null,
  );

  return (
    <div className="space-y-6">
      <header className="rounded-3xl cockpit-card-cyan p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/15 p-3 text-cyan-300">
            <Network className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold uppercase tracking-wide text-white">Hubungan dan Korelasi</h2>
            <p className="mt-1 text-xs text-slate-300">
              Volume, load factor, dan delay rate dibandingkan dengan durasi delay bandara.
            </p>
          </div>
        </div>
      </header>

      <InsightCard title="Keterkaitan paling kuat">
        {strongestRelationship
          ? <>
              <strong>{strongestRelationship.label.toLowerCase()}</strong> ·{' '}
              {strengthDescription(strongestRelationship.rho)} (ρ {strongestRelationship.rho.toFixed(3)}).
              {' '}{interpretRelationship(strongestRelationship.rho, strongestRelationship.xLabel)}
            </>
          : 'Sampel belum cukup untuk menghitung korelasi.'}{' '}
        Hasil menunjukkan keterkaitan pada agregat, bukan sebab-akibat atau prediksi.
      </InsightCard>

      <section className="grid gap-5 xl:grid-cols-2">
        <CorrelationCard
          title="Volume keberangkatan ↔ durasi delay"
          result={analysis.trafficDelay}
          xKey="logDepartures"
          xLabel="Log10 keberangkatan"
        />
        <CorrelationCard
          title="Tingkat keterlambatan ↔ durasi delay"
          result={analysis.delayRateDelay}
          xKey="delayRate"
          xLabel="Tingkat keterlambatan (%)"
        />
        <CorrelationCard
          title="Load factor ↔ durasi delay"
          result={analysis.loadDelay}
          xKey="loadFactor"
          xLabel="Load factor (%)"
        />
      </section>
    </div>
  );
};
