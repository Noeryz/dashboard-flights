import React, { useMemo } from 'react';
import { Network } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFlightStore } from '../../store/useFlightStore';
import {
  analyzeMonthlyRelationships,
  compareMatchedYears,
  type MonthlyCorrelation,
  type RelationshipPoint,
} from '../../utils/monthlyRelationshipAnalysis';
import {
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
} from '../../utils/chartStyles';
import { InsightCard } from './InsightCard';

const formatNumber = (value: number, digits = 2): string =>
  value.toLocaleString('id-ID', { maximumFractionDigits: digits });

const formatRho = (rho: number | null): string => rho === null ? 'Belum cukup data' : rho.toFixed(3);

const describeStrength = (rho: number | null): string => {
  if (rho === null) return 'Belum cukup data untuk menghitung pola.';
  const magnitude = Math.abs(rho);
  const strength = magnitude < 0.2
    ? 'hampir tidak terlihat'
    : magnitude < 0.4
      ? 'lemah'
      : magnitude < 0.6
        ? 'sedang'
        : magnitude < 0.8
          ? 'kuat'
          : 'sangat kuat';
  const direction = rho > 0 ? 'searah' : rho < 0 ? 'berlawanan arah' : 'tidak menunjukkan arah';
  return `Pola ${strength} dan ${direction}.`;
};

const StatisticCard: React.FC<{
  label: string;
  value: string;
  detail?: string;
  tone?: 'cyan' | 'violet' | 'amber';
}> = ({ label, value, detail, tone = 'cyan' }) => {
  const color = tone === 'amber' ? 'text-amber-300' : tone === 'violet' ? 'text-violet-300' : 'text-cyan-300';
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      <p className="text-[10px] uppercase text-slate-400">{label}</p>
      <p className={`mt-1 break-words font-mono text-lg font-bold ${color}`}>{value}</p>
      {detail && <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{detail}</p>}
    </div>
  );
};

const Disclosure: React.FC<{ children: React.ReactNode; tone?: 'cyan' | 'amber' }> = ({
  children,
  tone = 'cyan',
}) => (
  <details className="group border-t border-slate-800 pt-3">
    <summary className={`inline-flex cursor-pointer list-none items-center rounded-lg border px-3 py-2 text-[11px] font-semibold transition-colors ${
      tone === 'amber'
        ? 'border-amber-400/30 bg-amber-950/30 text-amber-200 hover:bg-amber-900/40'
        : 'border-cyan-400/30 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-900/40'
    }`}>
      Lihat cara baca dan batasan
    </summary>
    <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-slate-300">{children}</div>
  </details>
);

const CorrelationCard: React.FC<{
  title: string;
  xLabel: string;
  yLabel: string;
  result: MonthlyCorrelation;
  interpretation: (rho: number | null) => string;
  note: string;
}> = ({ title, xLabel, yLabel, result, interpretation, note }) => (
  <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
    <div>
      <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-cyan-300">Korelasi Spearman · baris bulanan</p>
      <h4 className="text-xs font-bold text-slate-100">{title}</h4>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{note}</p>
    </div>
    {result.points.length > 0 ? (
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, bottom: 24, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="x"
              type="number"
              name={xLabel}
              domain={['auto', 'auto']}
              tickFormatter={(value) => Number(value).toLocaleString('id-ID', { maximumFractionDigits: 1, notation: 'compact' })}
              stroke="#94a3b8"
              fontSize={9}
              tickLine={false}
              label={{ value: xLabel, position: 'insideBottom', offset: -14, fill: '#94a3b8', fontSize: 9 }}
            />
            <YAxis
              dataKey="y"
              type="number"
              name={yLabel}
              domain={['auto', 'auto']}
              tickFormatter={(value) => Number(value).toLocaleString('id-ID', { maximumFractionDigits: 1 })}
              stroke="#94a3b8"
              fontSize={9}
              tickLine={false}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 9 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              formatter={(value, name) => [formatNumber(Number(value)), name]}
            />
            <Scatter data={result.points} fill="#22d3ee" fillOpacity={0.72} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
        Belum ada cukup baris yang memenuhi syarat untuk menggambar pola.
      </p>
    )}
    <div className="grid grid-cols-2 gap-3">
      <StatisticCard label="Korelasi ρ" value={formatRho(result.rho)} />
      <StatisticCard label="Baris yang dianalisis" value={result.sampleSize.toLocaleString('id-ID')} tone="violet" />
    </div>
    <Disclosure>
      <p>{interpretation(result.rho)}</p>
      <p>{describeStrength(result.rho)} Nilai ρ menunjukkan arah dan kekuatan pola peringkat, bukan besar perubahan menit.</p>
      <p>Setiap titik pada grafik merangkum kelompok baris dengan nilai X yang berdekatan. Angka baris adalah jumlah pasangan yang dihitung sebelum diringkas.</p>
      <p>Korelasi adalah keterkaitan. Dengan data observasional bulanan ini, grafik tidak membuktikan bahwa X menyebabkan Y.</p>
    </Disclosure>
  </article>
);

const MonthlyTrendChart: React.FC<{
  title: string;
  points: RelationshipPoint[];
  xLabel: string;
  yLabel: string;
  note: string;
}> = ({ title, points, xLabel, yLabel, note }) => (
  <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
    <div>
      <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-cyan-300">Korelasi Spearman · pasangan baris bulanan</p>
      <h4 className="text-xs font-bold text-slate-100">{title}</h4>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{note}</p>
    </div>
    {points.length ? (
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, bottom: 24, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="x" type="number" name={xLabel} domain={['auto', 'auto']} stroke="#94a3b8" fontSize={9}
              tickFormatter={(value) => formatNumber(Number(value), 1)}
              label={{ value: xLabel, position: 'insideBottom', offset: -14, fill: '#94a3b8', fontSize: 9 }} />
            <YAxis dataKey="y" type="number" name={yLabel} domain={['auto', 'auto']} stroke="#94a3b8" fontSize={9}
              tickFormatter={(value) => formatNumber(Number(value), 1)}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 9 }} />
            <Tooltip contentStyle={CHART_TOOLTIP_CONTENT_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              formatter={(value, name) => [formatNumber(Number(value)), name]} />
            <Scatter data={points} fill="#a78bfa" fillOpacity={0.72} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
        Data bulan berurutan yang cocok belum cukup untuk dibandingkan.
      </p>
    )}
  </article>
);

const DelayAttributionChart: React.FC<{
  categories: Array<{ category: string; minutes: number; share: number }>;
  totalMinutes: number;
}> = ({ categories, totalMinutes }) => (
  <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
    <div>
      <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-amber-200">Atribusi yang dicatat · bukan uji sebab-akibat</p>
      <h4 className="text-xs font-bold text-slate-100">Pembagian menit delay menurut kategori data</h4>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
        Persentase menunjukkan bagian dari total menit pada lima kategori yang tersedia, sesuai klasifikasi dalam CSV.
      </p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <StatisticCard label="Total menit pada lima kategori" value={`${Math.round(totalMinutes).toLocaleString('id-ID')} menit`} />
      <StatisticCard
        label="Menit tercatat pada kategori cuaca"
        value={`${Math.round(categories.find((category) => category.category === 'Cuaca')?.minutes ?? 0).toLocaleString('id-ID')} menit`}
        detail={`${formatNumber(categories.find((category) => category.category === 'Cuaca')?.share ?? 0)}% dari lima kategori`}
        tone="amber"
      />
    </div>
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={categories} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" fontSize={9} tickFormatter={(value) => `${formatNumber(Number(value), 0)}%`} />
          <YAxis type="category" dataKey="category" width={142} stroke="#94a3b8" fontSize={9} />
          <Tooltip contentStyle={CHART_TOOLTIP_CONTENT_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE}
            itemStyle={CHART_TOOLTIP_ITEM_STYLE}
            formatter={(value, name, item) => name === 'Bagian'
              ? [`${formatNumber(Number(value))}%`, `${Number(item.payload.minutes).toLocaleString('id-ID')} menit`]
              : [value, name]} />
          <Bar dataKey="share" name="Bagian" radius={[0, 4, 4, 0]}>
            {categories.map((entry, index) => (
              <Cell key={entry.category} fill={index === 0 ? '#fbbf24' : '#22d3ee'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <Disclosure tone="amber">
      <p>Kategori cuaca, maskapai, NAS, keamanan, dan pesawat terlambat sebelumnya adalah klasifikasi menit yang tercatat dalam data penerbangan.</p>
      <p>Grafik ini menjawab “bagaimana menit tercatat dibagi menurut kategori”, bukan “berapa menit delay yang akan hilang jika faktor itu dihilangkan”.</p>
      <p>Klasifikasi alasan di dataset bukan pengukuran cuaca independen dan bukan kelompok pembanding. Karena itu bagian cuaca tidak dapat dipakai sendirian untuk menyimpulkan dampak kausal cuaca.</p>
      <p>Jumlah lima kategori dapat berbeda dari total menit keterlambatan karena aturan pencatatan dan kelengkapan data.</p>
    </Disclosure>
  </article>
);

const formatRateDifference = (difference: number): string =>
  `${difference > 0 ? '+' : ''}${formatNumber(difference)} poin persentase`;

export const RelationshipsPanel: React.FC = () => {
  const {
    rawRows,
    filters,
    routeFilterEnabled,
    getFilteredRows,
  } = useFlightStore();
  const filteredRows = getFilteredRows();
  const analysis = useMemo(
    () => analyzeMonthlyRelationships(filteredRows, rawRows),
    [filteredRows, rawRows],
  );
  const yearComparison = useMemo(
    () => compareMatchedYears(rawRows, filters, routeFilterEnabled),
    [rawRows, filters, routeFilterEnabled],
  );

  const filteredDescription = routeFilterEnabled
    ? `Rute ${filters.origin} → ${filters.destination}`
    : 'semua rute';
  const mainCorrelations = [
    { label: 'Penerbangan terjadwal ↔ persentase delay', result: analysis.correlations.scheduleAndDelay },
    { label: 'Keterisian kursi ↔ persentase delay', result: analysis.correlations.loadAndDelay },
    { label: 'Jarak rute ↔ durasi rata-rata delay', result: analysis.correlations.distanceAndDuration },
    { label: 'Delay bulan lalu ↔ delay bulan ini', result: analysis.correlations.previousAndCurrentDelay },
    { label: 'Persentase pembatalan ↔ persentase delay', result: analysis.correlations.cancellationAndDelay },
    { label: 'Persentase pengalihan ↔ persentase delay', result: analysis.correlations.diversionAndDelay },
  ];
  const availableCorrelations = mainCorrelations.filter(({ result }) => result.rho !== null);
  const strongest = availableCorrelations.reduce<(typeof availableCorrelations)[number] | null>(
    (best, current) => !best || Math.abs(current.result.rho ?? 0) > Math.abs(best.result.rho ?? 0) ? current : best,
    null,
  );

  const yearDifferenceText = yearComparison
    ? `Pada ${yearComparison.matchedRouteMonths.toLocaleString('id-ID')} pasangan carrier–rute–bulan yang tersedia, delay rate berubah dari ${formatNumber(yearComparison.delayRate2024)}% (2024) menjadi ${formatNumber(yearComparison.delayRate2025)}% (2025), atau ${formatRateDifference(yearComparison.delayRate2025 - yearComparison.delayRate2024)}.`
    : 'Tidak ditemukan pasangan carrier–rute–bulan yang sama di 2024 dan 2025 untuk filter ini.';

  return (
    <div className="space-y-6">
      <header className="rounded-3xl cockpit-card-cyan p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/15 p-3 text-cyan-300">
            <Network className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold uppercase tracking-wide text-white">Korelasi dan Sebab-Akibat</h2>
            <p className="mt-1 text-xs text-slate-300">
              Pola dihitung ulang dari {filteredDescription} dan filter waktu/maskapai yang dipilih.
            </p>
          </div>
        </div>
      </header>

      <InsightCard title="Penting: korelasi tidak cukup untuk menyatakan sebab">
        <p>Bagian korelasi menunjukkan variabel mana yang bergerak bersama pada baris agregat bulanan. Nilai korelasi yang kuat sekalipun tidak membuktikan bahwa X menyebabkan Y.</p>
        <p className="mt-2">Data ini tidak memiliki ukuran cuaca independen, kejadian kapasitas bandara, waktu tiap penerbangan, atau identitas pesawat. Maka dashboard tidak mengklaim bahwa suatu variabel telah terbukti menyebabkan variabel lain.</p>
        <p className="mt-2">Perbandingan tahun di bawah memasangkan carrier, rute, dan bulan kalender yang sama. Ini mengurangi sebagian perbedaan komposisi, tetapi tetap bukan eksperimen dan tidak menghilangkan faktor yang tidak tercatat.</p>
      </InsightCard>

      <InsightCard title="Pola terkuat pada filter saat ini">
        {strongest
          ? <><strong>{strongest.label}</strong>: {describeStrength(strongest.result.rho)} Nilai korelasi Spearman adalah <strong>ρ {formatRho(strongest.result.rho)}</strong> pada {strongest.result.sampleSize.toLocaleString('id-ID')} pasangan baris.</>
          : 'Belum ada cukup variasi dan baris untuk menghitung korelasi.'}{' '}
        Ini adalah keterkaitan, bukan bukti sebab-akibat.
      </InsightCard>

      <section className="space-y-4">
        <header className="rounded-3xl cockpit-card-cyan p-5">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-white">Korelasi Antarvariabel</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Setiap observasi adalah satu agregat bulanan carrier–rute. Grafik merangkum baris ke dalam kelompok supaya pola lebih mudah dibaca.
            ρ mendekati +1 berarti searah, −1 berlawanan arah, dan 0 berarti tidak tampak pola peringkat yang jelas.
          </p>
        </header>
        <div className="grid gap-4 xl:grid-cols-2">
          <CorrelationCard
            title="Penerbangan terjadwal ↔ persentase delay"
            xLabel="Penerbangan terjadwal"
            yLabel="Delay rate (%)"
            result={analysis.correlations.scheduleAndDelay}
            note="Delay rate = penerbangan terlambat ÷ keberangkatan yang dilakukan. Banyaknya jadwal menunjukkan skala, bukan ukuran kepadatan bandara secara langsung."
            interpretation={(rho) => rho === null
              ? 'Belum cukup data untuk membaca hubungan jadwal dan delay rate.'
              : `Pada ${filteredDescription}, baris dengan jadwal lebih banyak cenderung memiliki delay rate ${rho > 0 ? 'lebih tinggi' : rho < 0 ? 'lebih rendah' : 'serupa'}.`}
          />
          <CorrelationCard
            title="Keterisian kursi ↔ persentase delay"
            xLabel="Penumpang ÷ kursi (%)"
            yLabel="Delay rate (%)"
            result={analysis.correlations.loadAndDelay}
            note="Load factor dihitung dari penumpang dibagi kursi pada baris bulanan."
            interpretation={(rho) => rho === null
              ? 'Belum cukup data untuk membaca hubungan keterisian dan delay rate.'
              : `Pada ${filteredDescription}, keterisian kursi yang lebih tinggi cenderung muncul bersama delay rate ${rho > 0 ? 'lebih tinggi' : rho < 0 ? 'lebih rendah' : 'serupa'}.`}
          />
          <CorrelationCard
            title="Jarak rute ↔ durasi rata-rata delay"
            xLabel="Jarak rute (mil)"
            yLabel="Menit per penerbangan terlambat"
            result={analysis.correlations.distanceAndDuration}
            note="Setiap pasangan adalah satu rute asal–tujuan; menit dirata-ratakan dengan bobot jumlah penerbangan terlambat."
            interpretation={(rho) => rho === null
              ? 'Belum cukup rute untuk membandingkan jarak dan durasi.'
              : `Di antara rute yang tercatat, rute yang lebih jauh cenderung memiliki durasi rata-rata ${rho > 0 ? 'lebih tinggi' : rho < 0 ? 'lebih rendah' : 'serupa'}. Ini membandingkan rute berbeda, bukan perubahan jarak pada rute yang sama.`}
          />
          <MonthlyTrendChart
            title="Delay bulan lalu ↔ delay bulan ini pada carrier–rute yang sama"
            points={analysis.correlations.previousAndCurrentDelay.points}
            xLabel="Delay rate bulan sebelumnya (%)"
            yLabel="Delay rate bulan ini (%)"
            note={`${analysis.correlations.previousAndCurrentDelay.rho === null
              ? 'Belum cukup pasangan bulan berurutan.'
              : `${describeStrength(analysis.correlations.previousAndCurrentDelay.rho)} ρ = ${formatRho(analysis.correlations.previousAndCurrentDelay.rho)} dari ${analysis.correlations.previousAndCurrentDelay.sampleSize.toLocaleString('id-ID')} pasangan bulan berurutan.`}
              Korelasi waktu ini tidak membuktikan delay sebelumnya menyebabkan delay berikutnya.`}
          />
          <CorrelationCard
            title="Persentase pembatalan ↔ persentase delay"
            xLabel="Cancel rate (%)"
            yLabel="Delay rate (%)"
            result={analysis.correlations.cancellationAndDelay}
            note="Cancel rate = pembatalan ÷ penerbangan terjadwal. Korelasi dihitung pada baris bulanan yang memiliki jadwal."
            interpretation={(rho) => rho === null
              ? 'Belum cukup data untuk membaca hubungan pembatalan dan delay.'
              : `Baris dengan cancel rate lebih tinggi cenderung memiliki delay rate ${rho > 0 ? 'lebih tinggi' : rho < 0 ? 'lebih rendah' : 'serupa'}. Gangguan yang sama dapat memengaruhi keduanya; ini bukan bukti arah sebab.`}
          />
          <CorrelationCard
            title="Persentase pengalihan ↔ persentase delay"
            xLabel="Pengalihan ÷ keberangkatan (%)"
            yLabel="Delay rate (%)"
            result={analysis.correlations.diversionAndDelay}
            note="Kedua persentase dihitung per baris bulanan; pengalihan dapat terjadi bersamaan dengan gangguan operasi."
            interpretation={(rho) => rho === null
              ? 'Belum cukup data untuk membaca hubungan pengalihan dan delay.'
              : `Baris dengan pengalihan relatif lebih banyak cenderung memiliki delay rate ${rho > 0 ? 'lebih tinggi' : rho < 0 ? 'lebih rendah' : 'serupa'}. Hubungan bersamaan ini tidak menetapkan mana yang lebih dulu atau menjadi penyebab.`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <header className="rounded-3xl border border-amber-400/25 bg-amber-950/20 p-5">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-amber-100">Kategori Menit Keterlambatan</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Data mencatat menit menurut kategori alasan delay. Ini adalah atribusi yang tersedia di CSV, bukan estimasi eksperimental tentang apa yang akan terjadi jika faktor dihilangkan.
          </p>
        </header>
        <DelayAttributionChart categories={analysis.categories} totalMinutes={analysis.categoryMinutesTotal} />
      </section>

      <section className="space-y-4">
        <header className="rounded-3xl cockpit-card-cyan p-5">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-white">Perbedaan Maskapai dan Perbandingan Tahun</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Ini perbandingan deskriptif dengan penyebut yang sesuai. Perbedaan tidak dapat langsung dianggap dampak kausal maskapai atau tahun.
          </p>
        </header>
        <div className="grid gap-4 xl:grid-cols-2">
          <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <div>
              <h4 className="text-xs font-bold text-slate-100">Sepuluh maskapai dengan cancel rate tertinggi</h4>
              <p className="mt-1 text-[10px] text-slate-400">Hanya maskapai dengan minimal 10.000 penerbangan terjadwal pada filter aktif.</p>
            </div>
            {analysis.carriersByCancellation.length ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.carriersByCancellation} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" unit="%" stroke="#94a3b8" fontSize={9} />
                    <YAxis type="category" dataKey="carrier" width={62} stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={CHART_TOOLTIP_CONTENT_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                      itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                      formatter={(value, name, item) => [`${formatNumber(Number(value))}%`, `${name} · ${Number(item.payload.scheduled).toLocaleString('id-ID')} jadwal`]} />
                    <Bar dataKey="cancellationRate" name="Cancel rate" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
                Tidak ada maskapai dengan 10.000 penerbangan terjadwal pada filter ini. Coba perluas filter tahun, bulan, atau rute.
              </p>
            )}
            <Disclosure tone="amber">
              <p>Cancel rate dihitung sebagai jumlah pembatalan dibagi jumlah penerbangan terjadwal. Ambang minimal jadwal membantu menghindari perbandingan rate dari sampel yang sangat kecil.</p>
              <p>Grafik mengurutkan nilai tertinggi, bukan “maskapai terburuk”. Perbedaan jaringan rute, periode, dan kondisi operasi belum sepenuhnya terpisah.</p>
              <p>Mengatakan maskapai menyebabkan perbedaan memerlukan rancangan yang membandingkan carrier pada rute dan kondisi waktu yang sama serta menangani faktor lain.</p>
            </Disclosure>
          </article>

          <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <div>
              <h4 className="text-xs font-bold text-slate-100">Sepuluh maskapai dengan delay rate tertinggi</h4>
              <p className="mt-1 text-[10px] text-slate-400">Hanya maskapai dengan minimal 10.000 penerbangan terjadwal pada filter aktif.</p>
            </div>
            {analysis.carriersByDelay.length ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.carriersByDelay} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" unit="%" stroke="#94a3b8" fontSize={9} />
                    <YAxis type="category" dataKey="carrier" width={62} stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={CHART_TOOLTIP_CONTENT_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                      itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                      formatter={(value, name, item) => [`${formatNumber(Number(value))}%`, `${name} · ${Number(item.payload.departures).toLocaleString('id-ID')} keberangkatan`]} />
                    <Bar dataKey="delayRate" name="Delay rate" fill="#fb7185" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
                Tidak ada maskapai dengan 10.000 penerbangan terjadwal pada filter ini. Coba perluas filter tahun, bulan, atau rute.
              </p>
            )}
            <Disclosure tone="amber">
              <p>Delay rate dihitung sebagai jumlah penerbangan terlambat dibagi jumlah keberangkatan yang dilakukan.</p>
              <p>Urutan ini menunjukkan rate tertinggi pada filter aktif, bukan bahwa maskapai tersebut menyebabkan keterlambatan. Perbedaan rute, musim, jenis operasi, dan pencatatan ikut membentuk angka.</p>
            </Disclosure>
          </article>

          <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-violet-200">Pasangan carrier–rute–bulan kalender yang sama</p>
              <h4 className="text-xs font-bold text-slate-100">2024 dibanding 2025</h4>
              <p className="mt-1 text-[10px] text-slate-400">Filter bulan, maskapai, dan rute diterapkan; filter tahun sengaja dilewati agar dua tahun dapat dibandingkan.</p>
            </div>
            {yearComparison ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <StatisticCard label="Delay rate · 2024 → 2025"
                    value={`${formatNumber(yearComparison.delayRate2024)}% → ${formatNumber(yearComparison.delayRate2025)}%`}
                    tone="violet" />
                  <StatisticCard label="Perubahan delay rate"
                    value={formatRateDifference(yearComparison.delayRate2025 - yearComparison.delayRate2024)}
                    detail="2025 dikurangi 2024"
                    tone="amber" />
                  <StatisticCard label="Cancel rate · 2024 → 2025"
                    value={`${formatNumber(yearComparison.cancellationRate2024)}% → ${formatNumber(yearComparison.cancellationRate2025)}%`}
                    tone="violet" />
                  <StatisticCard label="Pasangan rute-bulan cocok"
                    value={yearComparison.matchedRouteMonths.toLocaleString('id-ID')}
                    detail="carrier + rute + bulan kalender"
                    tone="cyan" />
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { year: '2024', delayRate: yearComparison.delayRate2024, cancellationRate: yearComparison.cancellationRate2024 },
                      { year: '2025', delayRate: yearComparison.delayRate2025, cancellationRate: yearComparison.cancellationRate2025 },
                    ]} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={9} unit="%" />
                      <Tooltip contentStyle={CHART_TOOLTIP_CONTENT_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                        itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                        formatter={(value, name) => [`${formatNumber(Number(value))}%`, name]} />
                      <Bar dataKey="delayRate" name="Delay rate" fill="#fb7185" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cancellationRate" name="Cancel rate" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Disclosure tone="amber">
                  <p>{yearDifferenceText}</p>
                  <p>Rate dihitung dari total penerbangan terlambat ÷ total keberangkatan, dan pembatalan ÷ total jadwal pada pasangan yang cocok.</p>
                  <p>Memasangkan carrier, rute, dan bulan kalender membantu mengurangi perbedaan komposisi rute/musim. Perubahan tahun masih dapat dipengaruhi perubahan lain yang tidak tercatat. Jadi ini perbandingan terkontrol, bukan bukti bahwa “tahun” menyebabkan perubahan.</p>
                </Disclosure>
              </>
            ) : (
              <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">{yearDifferenceText}</p>
            )}
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-rose-400/25 bg-rose-950/20 p-5">
        <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-rose-100">Apa yang bisa dan belum bisa disimpulkan</h3>
        <div className="mt-3 grid gap-3 text-xs leading-relaxed text-slate-300 md:grid-cols-2">
          <p><strong className="text-cyan-200">Bisa:</strong> melihat kekuatan dan arah pola bulanan, membandingkan kategori menit yang tercatat, membandingkan maskapai dengan penyebut yang sama, dan melihat perubahan rate pada carrier–rute–bulan yang cocok.</p>
          <p><strong className="text-rose-200">Belum bisa:</strong> menyatakan “X menyebabkan Y”. Agregat bulanan tidak menunjukkan urutan kejadian di dalam bulan, cuaca yang diukur terpisah, kapasitas bandara, pesawat yang sama, atau faktor lain yang diperlukan untuk mengisolasi dampak.</p>
        </div>
        <p className="mt-3 border-t border-rose-400/20 pt-3 text-[11px] leading-relaxed text-slate-400">
          Untuk menguji dampak kausal cuaca, langkah yang disarankan tetap memasangkan data penerbangan bertanggal dengan pengukuran cuaca eksternal pada waktu dan bandara yang sama. Kolom WEATHER_DELAY_MINUTES di sini adalah klasifikasi alasan delay dalam dataset, bukan pengukuran cuaca independen.
        </p>
      </section>
    </div>
  );
};
