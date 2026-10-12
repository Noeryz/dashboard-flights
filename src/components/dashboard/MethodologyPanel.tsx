import React, { useMemo } from 'react';
import { BookOpenCheck, Database, Info, MapPinned, Rows3, Scale } from 'lucide-react';
import { useFlightStore } from '../../store/useFlightStore';
import { InsightCard } from './InsightCard';

const numberFormat = (value: number): string => value.toLocaleString('id-ID');

const FieldGroup: React.FC<{ title: string; fields: string; purpose: string }> = ({
  title,
  fields,
  purpose,
}) => (
  <article className="rounded-2xl border border-slate-800 bg-slate-950/65 p-4">
    <h4 className="font-mono text-xs font-bold uppercase text-cyan-200">{title}</h4>
    <p className="mt-2 font-mono text-[11px] text-slate-300">{fields}</p>
    <p className="mt-2 text-xs leading-relaxed text-slate-400">{purpose}</p>
  </article>
);

export const MethodologyPanel: React.FC = () => {
  const { rawRows, airportCoords } = useFlightStore();
  const coverage = useMemo(() => {
    const years = new Set<number>();
    const months = new Set<number>();
    const carriers = new Set<string>();
    const origins = new Set<string>();
    const destinations = new Set<string>();
    rawRows.forEach((row) => {
      years.add(Number(row.YEAR));
      months.add(Number(row.MONTH));
      carriers.add(row.UNIQUE_CARRIER);
      origins.add(row.ORIGIN);
      destinations.add(row.DEST);
    });
    const airportCodes = new Set([...origins, ...destinations]);
    const mapped = Array.from(airportCodes).filter((code) => airportCoords[code]).length;
    return {
      years: Array.from(years).sort(),
      months: months.size,
      carriers: carriers.size,
      origins: origins.size,
      destinations: destinations.size,
      airportCodes: airportCodes.size,
      mapped,
    };
  }, [rawRows, airportCoords]);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl cockpit-card-cyan p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/15 p-3 text-cyan-300">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold uppercase tracking-wide text-white">Data, Metodologi & Batas Interpretasi</h2>
            <p className="mt-1 text-xs text-slate-300">
              Penjelasan sumber, cakupan, alasan pemilihan variabel, dan batas yang perlu diketahui sebelum menyimpulkan.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Rows3, label: 'Baris agregat', value: numberFormat(rawRows.length) },
          { icon: Database, label: 'Tahun tersedia', value: coverage.years.join('–') || 'Memuat…' },
          { icon: Scale, label: 'Maskapai', value: numberFormat(coverage.carriers) },
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
        Aplikasi memuat <code>data_dashboard_final.csv</code> dan <code>airports_coords.csv</code> dari folder
        publik. Label proyek menyebut data BTS/T-100; rujukan resmi BTS TranStats dapat ditelusuri di{' '}
        <a
          href="https://www.transtats.bts.gov/"
          target="_blank"
          rel="noreferrer"
          className="text-cyan-300 underline underline-offset-2"
        >
          transtats.bts.gov
        </a>
        . Berkas lokal tidak menyertakan manifest sumber, tanggal unduh, query, atau catatan transformasi,
        sehingga dashboard tidak dapat membuktikan versi/riwayat ekstraksinya sendiri. CSV berisi agregat
        bulanan maskapai–bandara asal–bandara tujuan; satu baris bukan satu penerbangan individual.
        Koordinat dipakai untuk peta, bukan sebagai ukuran performa.
      </InsightCard>

      <section className="grid gap-3 md:grid-cols-2">
        <FieldGroup
          title="Traffic & kapasitas"
          fields="DEPARTURES_PERFORMED · PASSENGERS · SEATS · FREIGHT · DISTANCE"
          purpose="Keberangkatan mengukur volume segmen; penumpang dan kursi menggambarkan skala kapasitas. Load factor dihitung sebagai total penumpang ÷ total kursi, bukan rerata sederhana persentase baris. Freight dan jarak memberi konteks operasi, bukan ukuran kualitas layanan."
        />
        <FieldGroup
          title="Delay & pembatalan"
          fields="ARR_DELAY_FLIGHTS · TOTAL_ARR_DELAY_MINUTES · AVG_DELAY_MINUTES · CANCELLED_FLIGHTS · DIVERTED_FLIGHTS · DELAY_RATE · OTP_RATE"
          purpose="Rata-rata delay dibentuk dari total menit delay ÷ jumlah penerbangan terlambat. Delay rate menggunakan jumlah penerbangan terlambat ÷ keberangkatan. Pembatalan dalam CSV adalah hitungan agregat (bukan label biner per penerbangan); OTP adalah indikator turunan."
        />
        <FieldGroup
          title="Penyebab delay"
          fields="CARRIER_DELAY_MINUTES · WEATHER_DELAY_MINUTES · NAS_DELAY_MINUTES · SECURITY_DELAY_MINUTES · LATE_AIRCRAFT_DELAY_MINUTES"
          purpose="Kelima kolom memisahkan akumulasi menit delay menurut kategori yang tersedia. Perbandingan total menit membantu melihat kontribusi volume; ia tidak membuktikan akar penyebab atau tanggung jawab kausal."
        />
        <FieldGroup
          title="Periode & identitas segmen"
          fields="YEAR · MONTH · UNIQUE_CARRIER · ORIGIN · DEST · ORIGIN_CITY_NAME · DEST_CITY_NAME"
          purpose="Dimensi ini memungkinkan perbandingan bulanan, maskapai, dan pasangan rute. Data hanya memiliki tahun/bulan; tidak tersedia tanggal, hari dalam minggu, waktu jadwal/aktual, kode penerbangan, atau state asal-tujuan."
        />
      </section>

      <section className="rounded-3xl cockpit-card-normal p-5">
        <div className="mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-amber-300" />
          <h3 className="font-mono text-sm font-bold uppercase text-white">Kenapa variabel dan tampilan ini dipilih?</h3>
        </div>
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            Pertanyaan penelitian membandingkan beban operasi dengan performa delay. Karena itu volume,
            kursi, penumpang, delay, pembatalan, bulan, maskapai, serta bandara dipakai bersama: metrik kapasitas
            memberi konteks terhadap intensitas traffic, sedangkan delay dan pembatalan menggambarkan hasil operasi.
            Koordinat bandara mendukung pemetaan koridor. Variabel yang tidak terdapat pada CSV tidak diam-diam
            direkonstruksi atau dianggap tersedia.
          </p>
          <p>
            Ringkasan bulanan menampilkan delapan maskapai teratas hanya untuk menjaga grafik utama tetap terbaca;
            angka delapan bukan batas ekstraksi dataset. Panel performa maskapai merangkum seluruh kode yang lolos
            filter.             Panel bandara menampilkan Top 12 secara default, tetapi kontrol dapat memperluas grafik ke Top 25
            dan daftar berpaginasi mencakup semua bandara asal yang memiliki data; tidak ada batas delapan bandara
            pada cakupan analisis. Banyaknya kategori lengkap ditampilkan di sini: {numberFormat(coverage.origins)} asal,
            {' '}{numberFormat(coverage.destinations)} tujuan, dan {numberFormat(coverage.airportCodes)} kode bandara unik.
            Koordinat tersedia untuk {numberFormat(coverage.mapped)} kode unik pada berkas koordinat; kode lain tidak
            diberi posisi palsu di peta.
          </p>
          <p>
            Korelasi menggunakan Spearman pada profil bandara dengan minimal 1.000 keberangkatan dalam filter aktif
            untuk mengurangi profil sangat tipis; bandara di bawah ambang tetap muncul di ringkasan lain. Nilai-p
            merupakan aproksimasi dan hubungan tetap observasional. Segmen k-means bersifat eksploratif. Model delay
            memakai holdout waktu Q4 2025 dan harus dibandingkan dengan baseline; nilainya tidak boleh dibaca sebagai
            jaminan prediksi penerbangan individual.
          </p>
        </div>
      </section>

      <InsightCard title="Batas penting untuk menjawab pertanyaan penelitian">
        Sasaran penelitian menyebut <code>ARR_DELAY</code>, <code>CANCELLED</code>, dan kolom state serta data
        Airline On-Time. Kolom mentah persis tersebut tidak terdapat di CSV yang sedang dimuat; yang tersedia adalah
        sejumlah hitungan/metrik agregat dan kolom delay yang diturunkan. Maka dashboard mendeskripsikan hubungan
        antaragregat, bukan memvalidasi status tiap penerbangan. Data juga tidak menyediakan tanggal harian atau
        fitur cuaca eksternal, sehingga uji musim hanya perbandingan Juni–Agustus dan model belum layak dipakai untuk
        keputusan operasional. Untuk klaim yang dapat direplikasi, sertakan berkas sumber resmi, periode unduh,
        transformasi/join, definisi delay, dan unit analisis dalam laporan.
      </InsightCard>
    </div>
  );
};
