# FlightInsight

Dashboard analisis deskriptif data penerbangan AS untuk meninjau volume penerbangan, keterlambatan, pembatalan, kapasitas, maskapai, bandara, dan rute. Visualisasi mengikuti filter tahun, bulan, dan maskapai agar pola dapat dibandingkan pada cakupan data yang sama.

## Lingkup analisis

- **Deskriptif:** ringkasan metrik dan perbandingan menurut bulan, maskapai, bandara, rute, serta kategori keterlambatan.
- **Korelasi & sebab-akibat:** menu khusus menghitung ulang korelasi Spearman dari baris agregat bulanan sesuai filter aktif, menampilkan menit keterlambatan menurut kategori yang tercatat, perbandingan rate carrier, serta perbandingan 2024–2025 pada pasangan carrier–rute–bulan yang sama. Hasilnya menunjukkan asosiasi dan atribusi dataset; bukan bukti bahwa satu variabel menyebabkan variabel lain.
- **Batas interpretasi:** data merupakan agregat bulanan carrier–rute, bukan catatan penerbangan individual. Hasil tidak melacak pesawat atau penerbangan antarbulan, dan tidak memuat pengukuran cuaca independen, kapasitas bandara, atau jam operasi. Kategori menit delay adalah klasifikasi yang tercatat dalam dataset, bukan pengukuran penyebab yang terpisah; karena itu hasil tidak menetapkan sebab-akibat atau memprediksi kinerja mendatang.
- **Wawasan operasional:** ditampilkan sebagai bagian dari Ringkasan Utama, bukan menu terpisah.
- **Kode carrier:** panel Performa Maskapai menampilkan kode persis seperti yang ada di CSV, tanpa mengganti atau memotongnya.

## Menjalankan aplikasi

Persyaratan: Node.js dan npm.

```sh
npm install
npm run dev
```

## Pemeriksaan dan deployment

```sh
npm run lint
npm run build
npm run deploy
```

Dataset dan aset statis dibaca dari folder `public/`. Data yang saat ini dipakai berada di `public/data/`.
