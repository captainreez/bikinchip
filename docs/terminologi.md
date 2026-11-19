# Panduan terminologi bikinchip

Tujuan: bahasa Indonesia gaya engineer. Istilah teknis tetap dalam bahasa Inggris, seperti yang dipakai di tim chip design, dan penjelasannya berbahasa Indonesia yang ringkas. Satu kata sapaan: **kamu** (bukan "Anda").

## Struktur kurikulum
| Istilah | Arti | Contoh |
|---|---|---|
| Part | 9 kelompok besar | Part 3 |
| Modul | M00–M34 | M04 |
| Lesson | satu halaman belajar | M04c |
| Section | 16 bagian dalam satu lesson | s01–s16 |
| Track | 6 spesialisasi | Digital RTL |

Jangan memakai kata "file" di UI. Status modul yang belum jadi: **Segera** (bukan "13/98 tersedia"). Angka statistik datang dari satu sumber: `ICD.stats()`.

## Penggantian istilah
| Hindari | Pakai |
|---|---|
| Devais | device |
| bangku uji | testbench |
| jabat tangan | handshake |
| rendemen | yield |
| denah chip | floorplan |
| mesin keadaan hingga | FSM |
| sudut PVT | PVT corner |
| cakupan (verifikasi) | coverage |
| rantai scan | scan chain |
| sintesis pohon clock | clock tree synthesis |
| jatuh tegangan IR | IR drop |
| transistor sirip | FinFET |
| komplemen dua | two's complement |
| waktu setup / hold | setup time / hold time |
| tepi clock | clock edge |
| masukan / keluaran | input / output |
| penyangga | buffer |
| desimal tak bertanda | desimal unsigned |
| Lebar (jumlah bit) | bit width |
| Saring istilah | Cari istilah |
| Dasbor | Dashboard |
| sinkron antarperangkat | sinkronisasi antar-device |

Pengecualian yang sengaja dibiarkan: "lebar pita" (bandwidth), "lebar die" (dimensi fisik), "cakupan TLB" (TLB reach), `idn:` di glosarium (padanan Indonesia untuk referensi), dan isi `<pre>`/`<code>`.

## Microcopy
Pendek, aktif, tanpa jargon internal. Tombol utama: "Mulai dari M00". Jangan menampilkan teks internal (Fase, versi core, nama kunci penyimpanan, perintah server) di UI. Versi hanya kecil di footer.

## Menerapkan
`python3 tools/terminologi.py [--dry] src/*.src.html src/core.js` lalu tinjau diff. Skrip melewati `<pre>`, `<code>`, `<script>`, `<style>` dan baris `idn:`.
