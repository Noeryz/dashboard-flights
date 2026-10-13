# FlightInsight

Dashboard analisis deskriptif data penerbangan AS untuk meninjau volume penerbangan, keterlambatan, pembatalan, kapasitas, maskapai, bandara, dan rute. Visualisasi mengikuti filter tahun, bulan, dan maskapai agar pola dapat dibandingkan pada cakupan data yang sama.

## Lingkup analisis

- **Deskriptif:** ringkasan metrik dan perbandingan menurut bulan, maskapai, bandara, rute, serta kategori keterlambatan.
- **Batas interpretasi:** data merupakan agregat bulanan carrier–rute, bukan catatan penerbangan individual. Hasil menunjukkan pola pada data yang tersedia, bukan penyebab keterlambatan atau prediksi kinerja mendatang.
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
