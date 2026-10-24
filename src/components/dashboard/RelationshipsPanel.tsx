import React, { useMemo } from 'react';
import { Network } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFlightStore } from '../../store/useFlightStore';
import type { RawFlightRow } from '../../types/flight';
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

interface TrendPoint {
  x: number;
  y: number;
  count: number;
}

const StatisticCard: React.FC<{
  label: string;
  value: string;
  valueClassName?: string;
}> = ({ label, value, valueClassName = 'text-cyan-300' }) => (
  <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
    <p className="text-[10px] uppercase text-slate-400">{label}</p>
    <p className={`mt-1 break-words font-mono text-xl font-bold ${valueClassName}`}>{value}</p>
  </div>
);

const InterpretationDisclosure: React.FC<{
  children: React.ReactNode;
  tone?: 'cyan' | 'amber';
}> = ({ children, tone = 'cyan' }) => (
  <details className="group border-t border-slate-800 pt-3">
    <summary className={`inline-flex cursor-pointer list-none items-center rounded-lg border px-3 py-2 text-[11px] font-semibold transition-colors ${
      tone === 'amber'
        ? 'border-amber-400/30 bg-amber-950/30 text-amber-200 hover:bg-amber-900/40'
        : 'border-cyan-400/30 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-900/40'
    }`}>
      Lihat Interpretasi
    </summary>
    <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-slate-300">{children}</div>
  </details>
);

const numberValue = (value: number | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const makeQuantileTrend = (
  rows: RawFlightRow[],
  getX: (row: RawFlightRow) => number,
  getY: (row: RawFlightRow) => number,
  isValid: (row: RawFlightRow) => boolean,
  binCount = 20,
): TrendPoint[] => {
  const pairs = rows.flatMap((row) => {
    if (!isValid(row)) return [];
    const x = getX(row);
    const y = getY(row);
    return Number.isFinite(x) && Number.isFinite(y) ? [{ x, y }] : [];
  }).sort((left, right) => left.x - right.x);
  if (!pairs.length) return [];

  return Array.from({ length: Math.min(binCount, pairs.length) }, (_, bin) => {
    const start = Math.floor((bin * pairs.length) / Math.min(binCount, pairs.length));
    const end = Math.floor(((bin + 1) * pairs.length) / Math.min(binCount, pairs.length));
    const values = pairs.slice(start, end);
    return {
      x: values.reduce((sum, point) => sum + point.x, 0) / values.length,
      y: values.reduce((sum, point) => sum + point.y, 0) / values.length,
      count: values.length,
    };
  });
};

const TrendChart: React.FC<{
  title: string;
  points: TrendPoint[];
  xLabel: string;
  yLabel: string;
  note: string;
  method?: string;
  result?: string;
  pValue?: string;
  narrative?: string;
  connectPoints?: boolean;
}> = ({
  title,
  points,
  xLabel,
  yLabel,
  note,
  method,
  result,
  pValue,
  narrative,
  connectPoints = true,
}) => (
  <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        {method && (
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
            Metode · {method}
          </p>
        )}
        <h4 className="text-xs font-bold text-slate-100">{title}</h4>
      </div>
    </div>
    <div>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{note}</p>
    </div>
    {points.length ? (
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {connectPoints ? (
            <LineChart data={points} margin={{ top: 8, right: 12, bottom: 22, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="x"
                type="number"
                domain={['auto', 'auto']}
                tickFormatter={(value) => Number(value).toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                name={xLabel}
                stroke="#94a3b8"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                label={{ value: xLabel, position: 'insideBottom', offset: -14, fill: '#94a3b8', fontSize: 9 }}
              />
              <YAxis
                dataKey="y"
                type="number"
                domain={['auto', 'auto']}
                tickFormatter={(value) => Number(value).toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                name={yLabel}
                stroke="#94a3b8"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                labelFormatter={(_, payload) => payload[0]?.payload
                  ? `${xLabel}: ${Number(payload[0].payload.x).toLocaleString('id-ID', { maximumFractionDigits: 2 })}`
                  : ''}
                formatter={(value, name) => [
                  Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }),
                  name,
                ]}
              />
              <Line
                type="monotone"
                dataKey="y"
                name={yLabel}
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#67e8f9' }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          ) : (
            <ScatterChart margin={{ top: 8, right: 12, bottom: 22, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="x"
                type="number"
                domain={['auto', 'auto']}
                tickFormatter={(value) => Number(value).toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                name={xLabel}
                stroke="#94a3b8"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                label={{ value: xLabel, position: 'insideBottom', offset: -14, fill: '#94a3b8', fontSize: 9 }}
              />
              <YAxis
                dataKey="y"
                type="number"
                domain={['auto', 'auto']}
                tickFormatter={(value) => Number(value).toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                name={yLabel}
                stroke="#94a3b8"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                formatter={(value, name) => [
                  Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }),
                  name,
                ]}
              />
              <Scatter data={points} name={yLabel} fill="#22d3ee" fillOpacity={0.7} />
            </ScatterChart>
          )}
        </ResponsiveContainer>
      </div>
    ) : (
      <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
        Data belum cukup untuk membentuk grafik pada filter ini.
      </p>
    )}
    {connectPoints && (
      <p className="text-[10px] text-slate-500">Setiap titik adalah rata-rata satu kelompok kuantil berisi observasi seimbang.</p>
    )}
    {result && (
      <div className={`grid gap-3 ${pValue ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <StatisticCard
          label={result.startsWith('ρ') ? 'Korelasi Spearman (ρ)' : result.startsWith('β') ? 'Koefisien estimasi (β)' : 'Indikator hasil'}
          value={result.replace(/^(ρ|β)\s*/, '')}
        />
        {pValue && <StatisticCard label="Nilai p" value={pValue} valueClassName="text-violet-300" />}
      </div>
    )}
    {(narrative || pValue || result) && (
      <InterpretationDisclosure>
        <p>{narrative ?? note}</p>
        {pValue && <p className="text-slate-400">Uji signifikansi: p-value {pValue}.</p>}
      </InterpretationDisclosure>
    )}
  </article>
);

const MonthlyOperationsChart: React.FC<{
  rows: RawFlightRow[];
  result: string;
  narrative: string;
}> = ({ rows, result, narrative }) => {
  const points = useMemo(() => makeQuantileTrend(
    rows,
    (row) => numberValue(row.SCHEDULED_FLIGHTS),
    (row) => numberValue(row.DEPARTURES_PERFORMED),
    (row) => numberValue(row.SCHEDULED_FLIGHTS) > 0,
  ), [rows]);

  return (
    <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <div>
        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-cyan-300">Metode · Korelasi Spearman</p>
        <h4 className="text-xs font-bold text-slate-100">Penerbangan terjadwal ↔ keberangkatan dilakukan</h4>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
          Setiap titik merangkum baris dengan jumlah jadwal serupa; titik tidak mewakili bulan atau penerbangan individual.
        </p>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, bottom: 22, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="x"
              type="number"
              name="Penerbangan terjadwal"
              stroke="#94a3b8"
              fontSize={9}
              tickLine={false}
              tickFormatter={(value) => Number(value).toLocaleString('id-ID', { notation: 'compact' })}
              label={{ value: 'Terjadwal', position: 'insideBottom', offset: -14, fill: '#94a3b8', fontSize: 9 }}
            />
            <YAxis
              dataKey="y"
              type="number"
              name="Keberangkatan dilakukan"
              stroke="#94a3b8"
              fontSize={9}
              tickLine={false}
              tickFormatter={(value) => Number(value).toLocaleString('id-ID', { notation: 'compact' })}
              label={{ value: 'Dilakukan', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 9 }}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              formatter={(value, name) => [Number(value).toLocaleString('id-ID'), name]}
            />
            <Scatter data={points} name="Rerata kelompok" fill="#22d3ee" fillOpacity={0.75} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatisticCard label="Korelasi Spearman (ρ)" value={result} />
        <StatisticCard label="Nilai p" value="<0,001" valueClassName="text-violet-300" />
      </div>
      <InterpretationDisclosure>
        <p>{narrative}</p>
        <p className="text-slate-400">Uji signifikansi: p-value &lt;0,001.</p>
      </InterpretationDisclosure>
    </article>
  );
};

const AnnualRatesChart: React.FC<{ rows: RawFlightRow[] }> = ({ rows }) => {
  const points = useMemo(() => [2024, 2025].map((year) => {
    const annualRows = rows.filter((row) => Number(row.YEAR) === year);
    const departures = annualRows.reduce((sum, row) => sum + numberValue(row.DEPARTURES_PERFORMED), 0);
    const scheduled = annualRows.reduce((sum, row) => sum + numberValue(row.SCHEDULED_FLIGHTS), 0);
    const delayed = annualRows.reduce((sum, row) => sum + numberValue(row.ARR_DELAY_FLIGHTS), 0);
    const cancelled = annualRows.reduce((sum, row) => sum + numberValue(row.CANCELLED_FLIGHTS), 0);
    return {
      year: String(year),
      delayRate: departures > 0 ? (delayed / departures) * 100 : 0,
      cancelRate: scheduled > 0 ? (cancelled / scheduled) * 100 : 0,
      departures,
      scheduled,
    };
  }), [rows]);

  return (
    <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <div>
        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-violet-200">Grafik deskriptif · rate tahunan</p>
        <h4 className="text-xs font-bold text-slate-100">Rate tahunan: delay dan pembatalan</h4>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
          Rate dihitung dengan denominator yang sesuai. Sumbu kiri menunjukkan delay rate, sumbu kanan cancel rate; skala keduanya berbeda.
          Perubahan tahun bukan dengan sendirinya efek kausal.
        </p>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} />
            <YAxis yAxisId="delay" stroke="#fb7185" fontSize={9} unit="%" domain={[0, 'auto']} />
            <YAxis yAxisId="cancel" orientation="right" stroke="#fbbf24" fontSize={9} unit="%" domain={[0, 'auto']} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
            />
            <Bar yAxisId="delay" dataKey="delayRate" name="Delay rate (sumbu kiri)" fill="#fb7185" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="delayRate"
                position="top"
                formatter={(value) => `${Number(value).toFixed(2)}%`}
                fill="#fecdd3"
                fontSize={9}
              />
            </Bar>
            <Bar yAxisId="cancel" dataKey="cancelRate" name="Cancel rate (sumbu kanan)" fill="#fbbf24" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="cancelRate"
                position="top"
                formatter={(value) => `${Number(value).toFixed(2)}%`}
                fill="#fde68a"
                fontSize={9}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatisticCard
          label="Delay rate · 2024 → 2025"
          value={points.every((point) => point.departures > 0)
            ? `${points[0].delayRate.toFixed(2)}% → ${points[1].delayRate.toFixed(2)}%`
            : 'Data tidak tersedia'}
        />
        <StatisticCard
          label="Cancel rate · 2024 → 2025"
          value={points.every((point) => point.scheduled > 0)
            ? `${points[0].cancelRate.toFixed(2)}% → ${points[1].cancelRate.toFixed(2)}%`
            : 'Data tidak tersedia'}
          valueClassName="text-amber-300"
        />
      </div>
      <InterpretationDisclosure>
        <p>Delay rate dihitung dari penerbangan terlambat dibagi keberangkatan yang dilakukan. Cancel rate dihitung dari pembatalan dibagi penerbangan terjadwal.</p>
        <p>Grafik membandingkan nilai agregat tahunan pada dua skala sumbu yang berbeda. Perubahan ini bersifat deskriptif dan tidak dengan sendirinya menunjukkan sebab-akibat.</p>
      </InterpretationDisclosure>
    </article>
  );
};

const CarrierCancellationChart: React.FC<{ rows: RawFlightRow[] }> = ({ rows }) => {
  const points = useMemo(() => {
    const totals = new Map<string, { scheduled: number; cancelled: number }>();
    rows.forEach((row) => {
      const carrier = String(row.UNIQUE_CARRIER || '').trim();
      const total = totals.get(carrier) ?? { scheduled: 0, cancelled: 0 };
      total.scheduled += numberValue(row.SCHEDULED_FLIGHTS);
      total.cancelled += numberValue(row.CANCELLED_FLIGHTS);
      totals.set(carrier, total);
    });
    return Array.from(totals.entries())
      .filter(([, total]) => total.scheduled >= 10000)
      .map(([carrier, total]) => ({
        carrier,
        cancelRate: (total.cancelled / total.scheduled) * 100,
        scheduled: total.scheduled,
      }))
      .sort((left, right) => right.cancelRate - left.cancelRate)
      .slice(0, 10);
  }, [rows]);

  return (
    <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <div>
        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-violet-200">Grafik deskriptif · perbandingan cancel rate</p>
        <h4 className="text-xs font-bold text-slate-100">Sepuluh carrier dengan cancel rate tertinggi</h4>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
          Hanya carrier dengan minimal 10.000 penerbangan terjadwal; ini perbandingan deskriptif, bukan efek carrier terkontrol.
        </p>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="carrier" stroke="#94a3b8" fontSize={9} />
            <YAxis stroke="#94a3b8" fontSize={9} unit="%" />
            <Tooltip
              contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              formatter={(value, name, item) => name === 'Cancel rate'
                ? [`${Number(value).toFixed(2)}%`, `${name} · jadwal ${Number(item.payload.scheduled).toLocaleString('id-ID')}`]
                : [value, name]}
            />
            <Bar dataKey="cancelRate" name="Cancel rate" fill="#fbbf24" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="cancelRate"
                position="top"
                formatter={(value) => `${Number(value).toFixed(2)}%`}
                fill="#fde68a"
                fontSize={9}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {points.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <StatisticCard
            label="Cancel rate tertinggi"
            value={`${points[0].cancelRate.toFixed(2)}%`}
            valueClassName="text-amber-300"
          />
          <StatisticCard
            label="Carrier ditampilkan"
            value={String(points.length)}
            valueClassName="text-violet-300"
          />
        </div>
      )}
      <InterpretationDisclosure>
        <p>Grafik mengurutkan hingga sepuluh carrier dengan cancel rate tertinggi di antara carrier yang memiliki sedikitnya 10.000 penerbangan terjadwal. Nilai rate dihitung sebagai jumlah pembatalan dibagi jumlah penerbangan terjadwal.</p>
        <p>Perbandingan ini bersifat deskriptif dan belum disesuaikan terhadap perbedaan rute, waktu, atau kondisi operasional.</p>
      </InterpretationDisclosure>
    </article>
  );
};

const CorrelationCard: React.FC<{
  title: string;
  result: CorrelationResult | null;
  xKey: 'logDepartures' | 'loadFactor' | 'delayRate';
  xLabel: string;
}> = ({ title, result, xKey, xLabel }) => (
  <section className="space-y-4 rounded-3xl cockpit-card-normal p-5">
    <div>
      <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-cyan-300">Metode · Korelasi Spearman</p>
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
          <StatisticCard label="Korelasi Spearman (ρ)" value={result.rho.toFixed(3)} />
          <StatisticCard
            label="Bandara dianalisis"
            value={result.sampleSize.toLocaleString('id-ID')}
            valueClassName="text-violet-300"
          />
        </div>
        <InterpretationDisclosure>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
            {strengthDescription(result.rho)}. {interpretRelationship(result.rho, xLabel)} Spearman membandingkan
            peringkat, bukan perubahan menit; hasil ini bukan bukti sebab-akibat.
          </p>
        </InterpretationDisclosure>
      </>
    ) : (
      <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
        Sampel bandara belum cukup untuk menghitung korelasi pada filter aktif. Perlu sedikitnya tiga bandara dengan minimal 1.000 keberangkatan dan data keterlambatan.
      </p>
    )}
  </section>
);

export const RelationshipsPanel: React.FC = () => {
  const { getFilteredRows, rawRows } = useFlightStore();
  const filteredRows = getFilteredRows();
  const analysis = useMemo(() => analyzeFlights(filteredRows), [filteredRows]);
  const studyTrends = useMemo(() => {
    const cancelledCount = makeQuantileTrend(
      rawRows,
      (row) => numberValue(row.DEPARTURES_PERFORMED),
      (row) => numberValue(row.CANCELLED_FLIGHTS),
      (row) => numberValue(row.DEPARTURES_PERFORMED) > 0,
    );
    const scheduledCancellationRate = makeQuantileTrend(
      rawRows,
      (row) => numberValue(row.SCHEDULED_FLIGHTS),
      (row) => (numberValue(row.CANCELLED_FLIGHTS) / numberValue(row.SCHEDULED_FLIGHTS)) * 100,
      (row) => numberValue(row.SCHEDULED_FLIGHTS) > 0,
    );
    const previousPeriodRows = new Map<string, RawFlightRow>();
    rawRows.forEach((row) => {
      const period = Number(row.YEAR) * 12 + Number(row.MONTH);
      previousPeriodRows.set(
        `${row.UNIQUE_CARRIER}|${row.ORIGIN}|${row.DEST}|${period}`,
        row,
      );
    });
    const laggedPairs = rawRows.flatMap((row) => {
      const departures = numberValue(row.DEPARTURES_PERFORMED);
      const previousPeriod = Number(row.YEAR) * 12 + Number(row.MONTH) - 1;
      const previous = previousPeriodRows.get(
        `${row.UNIQUE_CARRIER}|${row.ORIGIN}|${row.DEST}|${previousPeriod}`,
      );
      if (!previous || departures <= 0 || numberValue(previous.DEPARTURES_PERFORMED) <= 0) return [];
      return [{
        x: (numberValue(previous.ARR_DELAY_FLIGHTS) / numberValue(previous.DEPARTURES_PERFORMED)) * 100,
        y: (numberValue(row.ARR_DELAY_FLIGHTS) / departures) * 100,
      }];
    }).sort((left, right) => left.x - right.x);
    const laggedDelay = Array.from({ length: Math.min(20, laggedPairs.length) }, (_, bin) => {
      const binCount = Math.min(20, laggedPairs.length);
      const start = Math.floor((bin * laggedPairs.length) / binCount);
      const end = Math.floor(((bin + 1) * laggedPairs.length) / binCount);
      const values = laggedPairs.slice(start, end);
      return {
        x: values.reduce((sum, point) => sum + point.x, 0) / values.length,
        y: values.reduce((sum, point) => sum + point.y, 0) / values.length,
        count: values.length,
      };
    });

    return {
      loadDelay: makeQuantileTrend(
        rawRows,
        (row) => numberValue(row.SEAT_LOAD_FACTOR),
        (row) => (numberValue(row.ARR_DELAY_FLIGHTS) / numberValue(row.DEPARTURES_PERFORMED)) * 100,
        (row) => numberValue(row.DEPARTURES_PERFORMED) > 0,
      ),
      loadPassengers: makeQuantileTrend(
        rawRows,
        (row) => numberValue(row.SEAT_LOAD_FACTOR),
        (row) => numberValue(row.PASSENGERS),
        (row) => numberValue(row.SEATS) > 0,
      ),
      delayFrequencyDuration: makeQuantileTrend(
        rawRows,
        (row) => (numberValue(row.ARR_DELAY_FLIGHTS) / numberValue(row.DEPARTURES_PERFORMED)) * 100,
        (row) => numberValue(row.TOTAL_ARR_DELAY_MINUTES) / numberValue(row.DEPARTURES_PERFORMED),
        (row) => numberValue(row.DEPARTURES_PERFORMED) > 0,
      ),
      distanceDuration: makeQuantileTrend(
        rawRows,
        (row) => numberValue(row.DISTANCE),
        (row) => numberValue(row.TOTAL_ARR_DELAY_MINUTES) / numberValue(row.ARR_DELAY_FLIGHTS),
        (row) => numberValue(row.DISTANCE) > 0
          && numberValue(row.ARR_DELAY_FLIGHTS) > 0
          && numberValue(row.TOTAL_ARR_DELAY_MINUTES) > 0,
      ),
      cancelledCount,
      scheduledCancellationRate,
      volumeDelay: makeQuantileTrend(
        rawRows,
        (row) => Math.log10(Math.max(1, numberValue(row.DEPARTURES_PERFORMED))),
        (row) => (numberValue(row.ARR_DELAY_FLIGHTS) / numberValue(row.DEPARTURES_PERFORMED)) * 100,
        (row) => numberValue(row.DEPARTURES_PERFORMED) > 0,
      ),
      laggedDelay,
    };
  }, [rawRows]);
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
  const panelStudies = [
    {
      title: '1. Volume bulanan pada rute yang sama dan tingkat delay',
      estimate: '+0,67 poin persentase',
      supportingLabel: '95% CI',
      supportingValue: '+0,56 hingga +0,77 pp',
      detail: 'Per penggandaan keberangkatan pada carrier–rute yang sama; 95% CI +0,56 hingga +0,77 pp, p<0,001 (N=355.611).',
      method: 'WLS: delay rate ~ log(keberangkatan), fixed effect carrier–rute dan tahun-bulan; bobot keberangkatan, standard error dikelompokkan per carrier–rute.',
      reading: 'Kenaikan volume dalam pasangan carrier–rute berkaitan dengan kenaikan kecil tingkat delay setelah perbedaan tetap rute dan guncangan bulan-tahun dikontrol.',
    },
    {
      title: '2. Perubahan 2025 dibanding 2024 pada rute yang sama',
      estimate: 'Delay +1,20 pp · pembatalan +0,089 pp',
      supportingLabel: '95% CI · delay / pembatalan',
      supportingValue: '+1,09 hingga +1,30 pp / +0,064 hingga +0,114 pp',
      detail: 'Delay rate 95% CI +1,09 hingga +1,30 pp; cancel rate 95% CI +0,064 hingga +0,114 pp; keduanya p<0,001.',
      method: 'WLS dengan fixed effect carrier–rute dan bulan kalender, membandingkan indikator tahun 2025 terhadap 2024; bobot sesuai denominator masing-masing rate.',
      reading: 'Kenaikan tetap terlihat setelah kontrol pola musiman serta komposisi rute/carrier yang tidak berubah. Ini perbedaan terkontrol antartahun, bukan efek kausal tahun.',
    },
    {
      title: '3. Delay bulan sebelumnya ↔ delay bulan berikutnya',
      estimate: '+2,39 pp pada bulan berikutnya',
      supportingLabel: '95% CI',
      supportingValue: '+2,33 hingga +2,45 pp',
      detail: 'Untuk setiap kenaikan 10 pp delay rate bulan sebelumnya, asosiasi terestimasi +2,39 pp pada bulan ini (95% CI +2,33 hingga +2,45 pp; p<0,001; N=287.578 pasangan bulan berurutan).',
      method: 'WLS: delay rate bulan ini ~ delay rate bulan sebelumnya + log volume, fixed effect carrier–rute dan tahun-bulan; standard error dikelompokkan per carrier–rute.',
      reading: 'Ada persistensi agregat dari bulan ke bulan. Data tidak melacak pesawat atau penerbangan individual, sehingga hasil ini bukan bukti keterlambatan merambat pada pesawat yang sama.',
    },
    {
      title: '4. Jarak rute ↔ durasi delay setelah penyesuaian',
      estimate: '−1,57 menit per 1.000 mil',
      supportingLabel: '95% CI',
      supportingValue: '−2,30 hingga −0,83 menit',
      detail: '95% CI −2,30 hingga −0,83 menit; p<0,001; N=216.849 observasi dengan durasi delay teramati.',
      method: 'WLS: menit delay rata-rata ~ jarak/1.000 + log volume, fixed effect carrier dan tahun-bulan; bobot jumlah penerbangan terlambat, standard error dikelompokkan per rute.',
      reading: 'Arah asosiasi terkontrol berlawanan dengan korelasi mentah (+0,343). Perubahan arah menunjukkan komposisi carrier, waktu, dan volume penting; bukan bukti bahwa rute lebih panjang menurunkan delay.',
    },
    {
      title: '5. Perbedaan cancel rate antar-carrier',
      estimate: 'Perbedaan tetap terdeteksi',
      supportingLabel: 'Uji Wald · nilai p',
      supportingValue: '<0,001',
      detail: 'Uji Wald robust untuk efek carrier: p<0,001 (N=355.611; 74 carrier; 60 derajat bebas yang teridentifikasi oleh variasi data).',
      method: 'WLS: cancel rate = pembatalan/penerbangan terjadwal, kontrol log jadwal, fixed effect rute asal–tujuan dan tahun-bulan, efek carrier; standard error dikelompokkan per rute.',
      reading: 'Tingkat pembatalan berbeda menurut carrier setelah penyesuaian rute, waktu, dan volume. Uji ini tidak menetapkan ranking kausal atau menjelaskan faktor operasional di balik selisihnya.',
    },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-3xl cockpit-card-cyan p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/15 p-3 text-cyan-300">
            <Network className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold uppercase tracking-wide text-white">Analisis Hubungan Variabel</h2>
            <p className="mt-1 text-xs text-slate-300">
              Hubungan antarvariabel penerbangan serta perbandingan regresi setelah penyesuaian faktor yang tersedia.
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

      <section className="space-y-4">
        <header className="rounded-3xl cockpit-card-cyan p-5">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-white">Analisis Korelasi</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Setiap grafik menampilkan metode dan koefisien korelasi. Buka nilai ρ untuk melihat interpretasi, jumlah observasi,
            dan catatan pembacaan grafik.
          </p>
        </header>
        <div className="grid gap-4 xl:grid-cols-2">
          <MonthlyOperationsChart
            rows={rawRows}
            result="+0,999"
            narrative="Hubungan sangat kuat dan positif. Median ρ di dalam carrier adalah 0,999; per periode tahun-bulan 0,999; dan di antara 8.623 rute dengan sedikitnya 10 observasi, 0,997. Variabel merupakan hitungan dengan skala operasi yang sangat terkait, bukan hubungan sebab-akibat."
          />
          <TrendChart
            title="Load factor ↔ tingkat keterlambatan"
            points={studyTrends.loadDelay}
            xLabel="Load factor (%)"
            yLabel="Delay rate (%)"
            method="Korelasi Spearman"
            result="ρ +0,100"
            pValue="<0,001"
            narrative="Hubungan sangat lemah. Load factor dihitung sebagai penumpang dibagi kursi; asosiasi ini tidak menunjukkan bahwa load factor menyebabkan keterlambatan."
            note="Setiap titik adalah rerata load factor dan delay rate pada kelompok kuantil berukuran seimbang."
          />
          <TrendChart
            title="Load factor ↔ jumlah penumpang"
            points={studyTrends.loadPassengers}
            xLabel="Load factor (%)"
            yLabel="Penumpang per baris"
            method="Korelasi Spearman"
            result="ρ +0,388"
            pValue="<0,001"
            narrative="Hubungan lemah. Sebagian hubungan diharapkan secara matematis karena penumpang merupakan pembilang load factor."
            note="Grafik merangkum observasi menurut kuantil load factor; data mentah mencakup 355.611 baris."
          />
          <TrendChart
            title="Frekuensi delay ↔ menit delay per keberangkatan"
            points={studyTrends.delayFrequencyDuration}
            xLabel="Delay rate (%)"
            yLabel="Menit delay per keberangkatan"
            method="Korelasi Spearman"
            result="ρ +0,599"
            pValue="<0,001"
            narrative="Hubungan sedang setelah kedua ukuran dinyatakan per keberangkatan. Korelasi hitungan mentah antara penerbangan terlambat dan total menit adalah ρ +0,748; metrik hitungan mentah lebih dipengaruhi skala operasi."
            note="Kedua metrik dibagi jumlah keberangkatan untuk mengurangi pengaruh volume."
          />
          <TrendChart
            title="Jarak rute ↔ durasi rata-rata keterlambatan"
            points={studyTrends.distanceDuration}
            xLabel="Jarak rute (mil)"
            yLabel="Menit per penerbangan terlambat"
            method="Korelasi Spearman"
            result="ρ +0,343"
            pValue="<0,001"
            narrative="Korelasi mentah lemah dan positif. Model berganda terkontrol menghasilkan arah berbeda (−1,57 menit per tambahan 1.000 mil); korelasi tidak menyesuaikan carrier, periode, atau volume."
            note="Observasi tanpa durasi delay yang tercatat tidak disertakan."
          />
          <TrendChart
            title="Keberangkatan ↔ jumlah pembatalan"
            points={studyTrends.cancelledCount}
            xLabel="Keberangkatan dilakukan"
            yLabel="Jumlah pembatalan"
            method="Korelasi Spearman"
            result="ρ +0,490"
            pValue="<0,001"
            narrative="Hubungan sedang untuk hitungan mentah. Hitungan bertambah bersama skala operasi; karena itu pembatalan lebih tepat dibandingkan sebagai rate terhadap penerbangan terjadwal."
            note="Grafik kuantil memperlihatkan hitungan, bukan risiko pembatalan relatif."
          />
          <TrendChart
            title="Penerbangan terjadwal ↔ cancel rate"
            points={studyTrends.scheduledCancellationRate}
            xLabel="Penerbangan terjadwal"
            yLabel="Cancel rate (%)"
            method="Korelasi Spearman"
            result="ρ +0,450"
            pValue="<0,001"
            narrative="Hubungan sedang pada tingkat baris. Rate menggunakan jumlah penerbangan terjadwal sebagai denominator; hubungan ini bukan bukti bahwa lebih banyak jadwal menyebabkan pembatalan."
            note="Cancel rate dihitung sebagai pembatalan dibagi penerbangan terjadwal."
          />
          <TrendChart
            title="Volume bandara ↔ durasi rata-rata delay"
            points={analysis.trafficDelay?.points.map((point) => ({
              x: point.logDepartures,
              y: point.averageDelay,
              count: 1,
            })) ?? []}
            xLabel="Log10 keberangkatan bandara"
            yLabel="Menit delay rata-rata"
            method="Korelasi Spearman"
            result="ρ −0,642"
            pValue="<0,001"
            narrative="Hubungan kuat dan berlawanan arah pada 340 bandara dengan sedikitnya 1.000 keberangkatan dan durasi delay teramati. Ini perbandingan antarbandara, bukan efek perubahan volume pada bandara yang sama."
            note="Satu titik = satu bandara; sebaran titik tidak dihubungkan karena bandara bukan urutan waktu."
            connectPoints={false}
          />
        </div>
      </section>

      <section className="space-y-4">
        <header className="rounded-3xl border border-amber-400/25 bg-amber-950/20 p-5">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-amber-100">Regresi Panel dengan Penyesuaian Faktor</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Model membandingkan observasi setelah memperhitungkan faktor yang tercatat. Koefisien menunjukkan asosiasi
            terkontrol, bukan bukti sebab-akibat.
          </p>
        </header>
        <div className="grid gap-4 xl:grid-cols-2">
          {panelStudies.map((study) => (
            <article key={study.title} className="space-y-3 rounded-3xl cockpit-card-normal p-5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-200">
                Metode · Regresi linear berganda WLS dengan fixed effects
              </p>
              <h4 className="text-sm font-bold text-white">{study.title}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <StatisticCard label="Estimasi model" value={study.estimate} />
                <StatisticCard
                  label={study.supportingLabel}
                  value={study.supportingValue}
                  valueClassName="text-violet-300"
                />
              </div>
              {study.title.startsWith('1.') && (
                <TrendChart
                  title="Pola data volume ↔ delay rate"
                  points={studyTrends.volumeDelay}
                  xLabel="Log10 keberangkatan"
                  yLabel="Delay rate (%)"
                  method="Rerata kuantil dari data observasi"
                  result="β +0,67 pp per volume 2×"
                  note="Garis menghubungkan rerata kelompok observasi; koefisien regresi di atas diperoleh setelah penyesuaian fixed effects."
                  narrative="Garis menunjukkan pola mentah antar kelompok observasi. Nilai β adalah estimasi regresi yang telah disesuaikan terhadap fixed effects carrier–rute dan tahun-bulan."
                />
              )}
              {study.title.startsWith('2.') && <AnnualRatesChart rows={rawRows} />}
              {study.title.startsWith('3.') && (
                <TrendChart
                  title="Delay bulan sebelumnya ↔ bulan ini"
                  points={studyTrends.laggedDelay}
                  xLabel="Delay rate bulan sebelumnya (%)"
                  yLabel="Delay rate bulan ini (%)"
                  method="Rerata kuantil pasangan bulan berurutan"
                  result="β +2,39 pp per kenaikan 10 pp"
                  note="Satu pasangan berasal dari carrier–rute yang sama pada bulan berurutan."
                  narrative="Titik merangkum pasangan bulan berurutan pada carrier–rute yang sama. Estimasi regresi menunjukkan asosiasi agregat setelah penyesuaian; bukan bukti keterlambatan merambat pada pesawat yang sama."
                />
              )}
              {study.title.startsWith('4.') && (
                <TrendChart
                  title="Pola data jarak ↔ durasi delay"
                  points={studyTrends.distanceDuration}
                  xLabel="Jarak rute (mil)"
                  yLabel="Menit per penerbangan terlambat"
                  method="Rerata kuantil dari data observasi"
                  result="β −1,57 menit per 1.000 mil"
                  note="Garis menunjukkan pola data mentah; koefisien regresi telah disesuaikan terhadap carrier, periode, dan volume."
                  narrative="Garis merangkum pola mentah jarak dan durasi delay. Nilai β berasal dari regresi yang disesuaikan terhadap carrier, periode, dan volume; asosiasi ini tidak membuktikan bahwa jarak menyebabkan perubahan durasi delay."
                />
              )}
              {study.title.startsWith('5.') && <CarrierCancellationChart rows={rawRows} />}
              <InterpretationDisclosure tone="amber">
                  <p>{study.detail}</p>
                  <p>{study.method}</p>
                  <p>{study.reading}</p>
              </InterpretationDisclosure>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl cockpit-card-normal p-5">
        <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-white">Rumus, asumsi, dan referensi</h3>
        <div className="mt-3 grid gap-3 text-xs leading-relaxed text-slate-300 md:grid-cols-2">
          <p><strong className="text-cyan-200">Delay rate</strong> = ARR_DELAY_FLIGHTS / DEPARTURES_PERFORMED.</p>
          <p><strong className="text-cyan-200">Cancel rate</strong> = CANCELLED_FLIGHTS / SCHEDULED_FLIGHTS.</p>
          <p><strong className="text-cyan-200">Load factor</strong> = PASSENGERS / SEATS.</p>
          <p><strong className="text-cyan-200">Durasi delay rata-rata</strong> = total menit delay teramati / jumlah penerbangan terlambat yang memiliki menit tercatat.</p>
        </div>
        <p className="mt-4 border-t border-slate-700/70 pt-3 text-[11px] leading-relaxed text-slate-400">
          Referensi metode: Spearman, “The Proof and Measurement of Association Between Two Things,”
          <em> The American Journal of Psychology</em> 15(1), 72–101 (1904);
          Wooldridge, <em> Econometric Analysis of Cross Section and Panel Data</em>, edisi ke-2 (2010);
          Angrist &amp; Pischke, <em> Mostly Harmless Econometrics</em> (2009); Cameron &amp; Miller,
          “A Practitioner’s Guide to Cluster-Robust Inference,” <em>Journal of Human Resources</em> 50(2),
          317–372 (2015). Data penerbangan:
          {' '}<a href="https://www.transtats.bts.gov/" target="_blank" rel="noreferrer" className="text-cyan-300 underline">BTS TranStats</a>.
          Kontrol tidak menghilangkan confounding yang tidak tercatat, reverse causality, atau bias agregasi.
        </p>
      </section>
    </div>
  );
};
