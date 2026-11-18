# Rencana redesign UI/UX bikinchip

Status: draf untuk dikerjakan bertahap. Tiap fase selesai hanya jika semua tes lama + tes baru lulus, lalu di-commit sendiri-sendiri.

## 1. Hasil audit (kondisi sekarang)

| Temuan | Detail |
|---|---|
| Beranda satu halaman | `index.src.html` (59 KB) memuat 9 section: belajar, hasil cari, dashboard, peta, flashcard, rencana, glosarium, kalkulator, buku, data, tentang. Semua logika dashboard ada di satu `<script>` |
| Registry | `MODS` dan `TRACKS` di `core.js` sudah jadi sumber tunggal: 35 modul, 98 lesson, 9 Part, 6 Track. Tapi statistik di beranda dan dashboard dihitung terpisah (hero "±1.210 jam" dibulatkan dari jumlah lesson, dashboard menjumlah jam mentah) |
| Kata "file" bocor ke UI | "N dari M file modul", `reg.files`, "Bagian dibaca" bercampur dengan "section" |
| Teks internal di UI | "Fase D" (3 tempat), "ICD-Core x.y.z · skema penyimpanan icd.v1", "halaman uji komponen", "tanda uji", "Untuk pengembang", instruksi `http.server` |
| Navigasi | `.icd-top` sticky + pill chip Part yang di-scroll ke samping; footer hanya satu baris teks |
| Sapaan | "Anda" 422 kali, "kamu" 0 |
| Istilah | "Devais" 16, "penyangga" 6, "tepi clock" 11, "komplemen dua" 2, dst. di `index`, `core.js`, dan modul |
| Skema data | `icd.v1`: `progress, cards, notes, bookmarks, exams, plan, settings, meta`. `meta.schema = 1`. Ekspor/impor sudah ada. Sinkron Supabase memakai blob yang sama |
| Glosarium | Terkumpul saat runtime lewat `ICD.gloss.add` per halaman, jadi glosarium induk hanya berisi istilah halaman yang sedang dibuka |
| Build | `tools/build.py` menyisipkan core ke tiap `src/*.src.html` → `docs/`. Offline lewat `file://` harus tetap jalan |

## 2. Keputusan arsitektur

1. **Tetap static, tanpa framework.** Build step tetap `python3 tools/build.py docs`. Tidak ada bundler.
2. **URL.** Setiap halaman baru adalah satu file: `kurikulum.html`, `belajar.html`, `glosarium.html`, `tools.html`, `referensi.html`, `pengaturan.html`, `tentang.html`, `styleguide.html`. GitHub Pages juga melayani `/kurikulum` tanpa ekstensi, dan link internal memakai `.html` supaya tetap jalan dari `file://`. `<link rel="canonical">` memakai bentuk tanpa ekstensi.
3. **Shell bersama di ICD-Core** (bukan disalin per halaman): header, nav utama 5 item, bottom nav mobile, footer, palet pencarian Ctrl/⌘+K, breadcrumb. Halaman cukup mendeklarasikan `data-page` dan `data-crumb`.
4. **Satu sumber statistik.** Fungsi `ICD.stats()` di core menghitung modul, lesson, Part, jam, dan yang terbit dari registry. Semua halaman memanggilnya.
5. **Glosarium induk dibuat saat build.** `tools/extract_gloss.js` membuka tiap halaman di headless Chrome, mengambil `ICD.gloss.all()`, menulis `src/glosarium.json`; `build.py` menyisipkannya ke `glosarium.html`. Anchor `glosarium.html#istilah-<id>`.
6. **Sync Supabase tidak diubah.** Tombol Masuk hanya tampil bila `supabaseUrl`+`supabaseKey` terisi dan halaman dibuka lewat http(s). `requireLogin` tetap nonaktif sampai redesign selesai.

## 3. Migrasi data (tanpa merusak progres)

- Kunci tetap `icd.v1`, `meta.schema` tetap 1. Semua tambahan bersifat aditif dan opsional (`settings.theme`, `settings.density`, `meta.lastFile`).
- Pembacaan lama dijaga oleh `normalize()` yang sudah ada.
- Tes baru `tools/test_migrasi.js`: memasang fixture ekspor dari build 1.3.0 dan 1.4.0 (`tools/fixtures/*.json`), membuka halaman baru, lalu memastikan progress, kartu, catatan, bookmark, skor ujian, dan rencana identik; ekspor→reset→impor mengembalikan data persis sama.
- Tes lama `test_sync.js` (20) dan `test_auth.js` (35) harus tetap lulus tanpa diubah.

## 4. Design system

Token di `core.css` (custom properties), dipakai semua komponen:

- **Warna:** `--surface-0..3`, `--text`, `--text-2`, `--text-3`, `--accent`, `--success`, `--warning`, `--danger`, plus warna sinyal yang sudah ada. Nilai lama (`--bg`, `--card`, `--ink`, dst.) dipertahankan sebagai alias supaya modul yang ada tidak pecah.
- **Spacing:** 4/8 px (`--sp-1..8`). **Type scale:** 14/16/18/22/28/36/48. **Radius, shadow, focus ring** sebagai token.
- **Kontras:** `tools/contrast.js` menghitung rasio semua pasangan teks/latar, di tema terang dan gelap, dan gagal jika < 4,5:1 (teks normal) atau < 3:1 (UI besar).
- **Komponen:** Button (primary/secondary/ghost/danger, target ≥ 44 px), Card, Badge/Status (Belum mulai, Berjalan, Selesai, Segera), ProgressBar, Tabs, Callout (info, tip, warning, "Model buku teks vs kenyataan"), EmptyState, Toast, Dialog konfirmasi.
- **`styleguide.html`** menggantikan `uji-komponen.html` dan menampilkan semua token serta komponen. Isi uji komponen yang dipakai `tools/test.js` dipindah ke sana.

## 5. Terminologi dan bahasa

- `docs/terminologi.md` = keputusan istilah (EN asli vs padanan), sapaan "kamu", pola microcopy.
- `tools/terminologi.py` membaca tabel yang sama, menerapkannya ke `src/`, dan mencetak diff per file. Penggantian dibatasi pada daftar yang disepakati; kata umum (tegangan, arus, daya, gerbang logika) tidak disentuh.
- Dua tahap: (a) UI, glosarium, `core.js`, beranda; (b) isi modul, hanya istilah, ditinjau per file.
- Sapaan "Anda" → "kamu" (kapital di awal kalimat) di seluruh `src/`.
- Tes modul yang mencocokkan teks UI ikut diperbarui.

## 6. Urutan kerja

| Fase | Isi | Gerbang lulus |
|---|---|---|
| R0 | Baseline: jalankan semua tes, buat fixture migrasi, `test_migrasi.js` | semua hijau di build sekarang |
| R1 | Token, komponen, alias warna lama, `styleguide.html`, `tools/contrast.js` | kontras AA lulus; test.js lulus |
| R2 | Shell: header, nav 5 item, bottom nav, footer, breadcrumb, Ctrl/⌘+K, `ICD.stats()`, hapus teks internal | tes UI + a11y landmark |
| R3 | Pecah beranda: `index`, `kurikulum`, `belajar`, `glosarium`, `tools`, `referensi`, `pengaturan`, `tentang` | tes per halaman + migrasi |
| R4 | Halaman lesson: TOC scrollspy, progress tipis, toolbar ringkas per section, prev/next, breadcrumb, badge "Segera", title konsisten | 13 suite modul lulus (diperbarui) |
| R5 | Terminologi + sapaan | `grep` daftar lama = 0 di UI; diff ditinjau |
| R6 | A11y dan kualitas: keyboard graph, reduced-motion, OG/Twitter, sitemap.xml, favicon, manifest, Lighthouse mobile ≥ 95 | skrip Lighthouse/axe |
| R7 | Pasang ke GitHub Pages, perbarui folder laptop, baru nyalakan `requireLogin` | uji langsung di situs |

## 7. Risiko yang sudah terlihat

- 13 suite uji modul mengandalkan tombol per-section ("Tandai selesai", Bookmark, Catatan). Perubahan di R4 berarti tes ikut diubah; saya jaga perilaku data (auto-mark, bookmark, catatan) tetap sama.
- Lighthouse belum terpasang di sandbox; R6 memakai paket npm `lighthouse` bila bisa dipasang, kalau tidak, metrik dihitung dengan Chrome DevTools Protocol dan axe-core.
- Mengubah istilah di isi modul bisa menyentuh kode di blok `<pre>` atau nama variabel; tahap R5(b) mengecualikan `<pre>`, `<code>`, dan `lab/`.
