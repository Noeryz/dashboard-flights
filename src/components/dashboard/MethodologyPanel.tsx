import React, { useMemo } from 'react';
import { BookOpenCheck, Database, MapPinned, Rows3, Scale } from 'lucide-react';
import { useFlightStore } from '../../store/useFlightStore';
import { InsightCard } from './InsightCard';
import { CARRIER_NAMES } from '../../utils/referenceData';
import { getDelayDurationDataQuality } from '../../utils/flightAnalytics';

const numberFormat = (value: number): string => value.toLocaleString('id-ID');

const FieldGroup: React.FC<{ title: string; fields: string; purpose: string }> = ({
  title,
  fields,
  purpose,
}) => (
  <article className="rounded-2xl border border-slate-800 bg-slate-950/65 p-4">
    <h4 className="text-sm font-semibold text-cyan-100">{title}</h4>
    <p className="mt-2 text-[11px] text-slate-300">{fields}</p>
    <p className="mt-2 text-xs leading-relaxed text-slate-400">{purpose}</p>
  </article>
);

export const MethodologyPanel: React.FC = () => {
  const { rawRows } = useFlightStore();
  const delayDurationQuality = useMemo(() => getDelayDurationDataQuality(rawRows), [rawRows]);
  const coverage = useMemo(() => {
    const years = new Set<number>();
    const carriers = new Set<string>();
    const origins = new Set<string>();
    const destinations = new Set<string>();
    rawRows.forEach((row) => {
      years.add(Number(row.YEAR));
      carriers.add(row.UNIQUE_CARRIER);
      origins.add(row.ORIGIN);
      destinations.add(row.DEST);
    });
    return {
      years: Array.from(years).sort(),
      carriers: carriers.size,
      namedCarriers: Array.from(carriers).filter((code) => CARRIER_NAMES[code]).length,
      origins: origins.size,
      destinations: destinations.size,
    };
  }, [rawRows]);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl cockpit-card-cyan p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/15 p-3 text-cyan-300">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Data dan Metodologi</h2>
            <p className="mt-1 text-xs text-slate-300">
              Ringkasan isi data, cara membaca angka, dan hal yang perlu diingat saat melihat hasil.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Rows3, label: 'Baris agregat', value: numberFormat(rawRows.length) },
          { icon: Database, label: 'Tahun tersedia', value: coverage.years.join('–') || 'Memuat…' },
          { icon: Scale, label: 'Kode carrier', value: `${numberFormat(coverage.carriers)} · ${numberFormat(coverage.namedCarriers)} bernama` },
          { icon: MapPinned, label: 'Bandara asal / tujuan', value: `${numberFormat(coverage.origins)} / ${numberFormat(coverage.destinations)}` },
        ].map(({ icon: Icon, label, value }) => (
          <article key={label} className="rounded-2xl cockpit-card-normal p-4">
            <Icon className="h-5 w-5 text-cyan-300" />
            <p className="mt-3 text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 font-mono text-xl font-bold text-white">{value}</p>
          </article>
        ))}
      </section>

      <InsightCard title="Sumber dan unit observasi">
        Dashboard membaca <code>data_dashboard_final.csv</code> dan <code>airports_coords.csv</code>. Informasi
        proyek menyebut BTS/T-100; situs BTS dapat dibuka di{' '}
        <a
          href="https://www.transtats.bts.gov/"
          target="_blank"
          rel="noreferrer"
          className="text-cyan-300 underline underline-offset-2"
        >
          transtats.bts.gov
        </a>
        . Berkas yang tersedia tidak mencatat tanggal unduh atau langkah pengolahannya. CSV merangkum data per
        bulan, maskapai, bandara asal, dan tujuan; satu baris bukan satu penerbangan. Koordinat hanya dipakai
        untuk menempatkan bandara di peta.
      </InsightCard>

      <InsightCard title="Mengapa sebagian carrier tampil sebagai kode?">
        Data hanya berisi kode maskapai, bukan semua nama lengkap. Referensi yang tersedia mengenali{' '}
        {numberFormat(coverage.namedCarriers)} dari {numberFormat(coverage.carriers)} kode. Kode lain tetap
        ditampilkan sesuai data; namanya tidak ditebak agar tidak salah menyebut maskapai.
      </InsightCard>

      <InsightCard title="Kelengkapan menit delay dan dampaknya pada rata-rata">
        Dari {numberFormat(delayDurationQuality.recordsWithDelayedFlights)} baris dengan penerbangan terlambat,
        {' '}{numberFormat(delayDurationQuality.recordsWithoutDelayMinutes)} baris (
        {delayDurationQuality.recordsWithDelayedFlights > 0
          ? ((delayDurationQuality.recordsWithoutDelayMinutes / delayDurationQuality.recordsWithDelayedFlights) * 100).toFixed(1)
          : '0.0'}%) mencatat jumlah menit delay 0. Baris tersebut mencakup{' '}
        {numberFormat(delayDurationQuality.delayedFlightsWithoutMinutes)} dari{' '}
        {numberFormat(delayDurationQuality.totalDelayedFlights)} penerbangan terlambat. Maka, rata-rata menit
        hanya dihitung dari baris yang memiliki menit delay lebih dari nol. Angka rata-rata tidak mencakup
        keterlambatan yang durasinya tidak tercatat.
      </InsightCard>

      <section className="grid gap-3 md:grid-cols-2">
        <FieldGroup
          title="Traffic & kapasitas"
          fields="DEPARTURES_PERFORMED · PASSENGERS · SEATS · FREIGHT · DISTANCE"
          purpose="Jumlah keberangkatan menunjukkan banyaknya penerbangan. Penumpang dan kursi memberi gambaran kapasitas. Load factor adalah total penumpang dibagi total kursi. Kargo dan jarak memberi konteks perjalanan."
        />
        <FieldGroup
          title="Delay & pembatalan"
          fields="ARR_DELAY_FLIGHTS · TOTAL_ARR_DELAY_MINUTES · AVG_DELAY_MINUTES · CANCELLED_FLIGHTS · DIVERTED_FLIGHTS · DELAY_RATE · OTP_RATE"
          purpose="Persentase keterlambatan membandingkan penerbangan terlambat dengan jumlah keberangkatan. Rata-rata menit hanya memakai durasi yang tercatat lebih dari nol. Pembatalan dan pengalihan ditampilkan sebagai jumlah; keduanya bukan persentase."
        />
        <FieldGroup
          title="Kategori delay"
          fields="CARRIER_DELAY_MINUTES · WEATHER_DELAY_MINUTES · NAS_DELAY_MINUTES · SECURITY_DELAY_MINUTES · LATE_AIRCRAFT_DELAY_MINUTES"
          purpose="Data membagi menit keterlambatan ke lima kategori. Late-arriving aircraft berarti keterlambatan dari penerbangan sebelumnya terbawa ke penerbangan berikutnya. Data ini tidak menunjukkan penyebab awal atau pesawat yang terlibat."
        />
        <FieldGroup
          title="Periode & dimensi analisis"
          fields="YEAR · MONTH · UNIQUE_CARRIER · ORIGIN · DEST · ORIGIN_CITY_NAME · DEST_CITY_NAME"
          purpose="Kolom ini membantu membandingkan bulan, maskapai, bandara, dan rute. Data tidak memuat tanggal, hari, jam penerbangan, atau nomor penerbangan."
        />
      </section>

      <InsightCard title="Batas penting untuk menjawab pertanyaan penelitian">
        Data berisi ringkasan bulanan, bukan rincian setiap penerbangan. Hasil menunjukkan pola pada data yang
        tersedia, tetapi tidak menjelaskan penyebab keterlambatan atau memprediksi periode berikutnya. Data juga
        tidak memuat tanggal dan jam penerbangan maupun informasi cuaca dari luar dataset.
      </InsightCard>
    </div>
  );
};
