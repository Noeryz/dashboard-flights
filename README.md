# FlightInsight

Dashboard analisis deskriptif data penerbangan AS untuk meninjau volume penerbangan, keterlambatan, pembatalan, kapasitas, maskapai, bandara, dan rute. Visualisasi mengikuti filter tahun, bulan, dan maskapai agar pola dapat dibandingkan pada cakupan data yang sama.

## Lingkup analisis

- **Deskriptif:** ringkasan metrik dan perbandingan menurut bulan, maskapai, bandara, rute, serta kategori keterlambatan.
- **Hubungan & kausalitas:** menu khusus memuat enam korelasi dan lima analisis panel terkontrol. Estimasi panel menyesuaikan faktor terukur seperti carrier–rute dan periode, tetapi tetap ditafsirkan sebagai asosiasi, bukan bukti sebab-akibat.
- **Batas interpretasi:** data merupakan agregat bulanan carrier–rute, bukan catatan penerbangan individual. Hasil tidak melacak pesawat atau penerbangan antarbulan, dan tidak memuat semua faktor seperti cuaca eksternal maupun jam operasi; karena itu hasil tidak menetapkan penyebab keterlambatan atau memprediksi kinerja mendatang.
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
