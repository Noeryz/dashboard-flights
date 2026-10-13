# FlightInsight

Dashboard analisis deskriptif data penerbangan AS untuk meninjau volume operasi, keterlambatan, pembatalan, kapasitas, maskapai, bandara, dan rute. Visualisasi mengikuti filter tahun, bulan, dan maskapai agar pola dapat dibandingkan pada cakupan data yang sama.

## Lingkup analisis

- **Deskriptif:** ringkasan metrik dan perbandingan menurut bulan, maskapai, bandara, rute, serta kategori keterlambatan.
- **Batas interpretasi:** data merupakan agregat bulanan carrier–rute, bukan catatan penerbangan individual. Hasil menunjukkan pola pada data yang tersedia, bukan penyebab keterlambatan atau prediksi kinerja mendatang.
- **Nama carrier:** CSV menyimpan kode carrier, bukan nama. Dashboard menampilkan nama yang ada pada referensi lokal dan mempertahankan kode lain dengan penanda nama belum tersedia agar tidak menebak identitas. Referensi nama lokal tidak disertai crosswalk resmi bertanggal, sehingga identitas operator perlu dikonfirmasi sebelum dikutip.

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
