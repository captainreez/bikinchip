# Berkontribusi ke bikinchip

Terima kasih! Kontribusi paling berharga saat ini:

1. **Koreksi teknis.** Rumus, satuan, angka, atau klaim yang keliru. Buka *issue* dengan nama modul, bagian, isi yang salah, dan rujukan (buku dan bab, datasheet, atau standar).
2. **Bahasa.** Kalimat yang membingungkan, istilah yang tidak konsisten, atau padanan Indonesia yang lebih baik.
3. **Bug tampilan.** Sertakan browser, perangkat, lebar layar, dan tangkapan layar.
4. **Lab.** Laporkan versi tool yang Anda pakai bila keluaran lab berbeda.

## Aturan materi

- Bahasa Indonesia untuk penjelasan. Istilah teknis tetap dalam Bahasa Inggris, dengan padanan Indonesia saat pertama muncul (`<span data-term="id">`).
- Setiap rumus harus benar secara satuan. Setiap angka contoh harus bisa dihitung ulang.
- Setiap kode di halaman harus identik dengan berkas di `lab/` dan benar-benar dijalankan; uji modul memeriksa kesamaan ini.
- Klaim tentang teknologi terkini diberi stempel waktu ("per [bulan tahun]") dan sumber.
- Tool komersial disebut netral. Lab memakai tool open-source.
- Rujukan cukup sampai tingkat buku dan bab.

## Alur kerja

1. *Fork*, buat cabang, lalu sunting `src/*.src.html` (jangan `docs/`).
2. Jalankan `python3 tools/build.py docs`, lalu uji modul terkait (`node tools/test_mXX.js`) dan `node tools/test.js`.
3. Buka *pull request* yang menjelaskan apa yang diubah dan mengapa.

Komponen bersama (`src/core.js`, `src/core.css`) dipakai semua halaman. Perubahan di sana perlu uji seluruh modul.

Dengan mengirim kontribusi, Anda setuju kontribusi kode dilisensikan MIT dan kontribusi materi dilisensikan CC BY-SA 4.0.
