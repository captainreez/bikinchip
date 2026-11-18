# bikinchip

**Ayo jadi chip designer Indonesia.**

bikinchip adalah kurikulum IC design gratis dan open source dalam Bahasa Indonesia, dari tegangan dan bilangan biner sampai tapeout: 35 modul dalam 9 bagian.

Setiap modul adalah satu halaman HTML mandiri berisi 16 bagian:

- intuisi dan penjelasan formal;
- penjelasan tiga tingkat (pemula, engineer, pakar);
- minimal tiga visualisasi interaktif;
- contoh soal;
- kode yang benar-benar dijalankan;
- jebakan industri;
- latihan bertingkat;
- kuis dengan penjelasan setiap pilihan;
- pertanyaan interview;
- lab dengan tool open-source;
- flashcard.

**Situs:** `https://<username>.github.io/bikinchip/` (setelah GitHub Pages aktif)

## Cara belajar

- **Online:** buka situsnya. Progres tersimpan di browser. Dengan akun (opsional), progres, catatan, skor kuis, dan flashcard tersinkron ke semua perangkat.
- **Offline:** unduh repositori ini, lalu buka `docs/index.html` dengan klik dua kali. Semua halaman berjalan tanpa internet, tanpa CDN, dan tanpa instalasi.
- **Lab:** sumber setiap lab ada di `lab/mXX/`. Lab memakai tool open-source di Linux atau WSL2 (Icarus Verilog, Verilator, ngspice, Yosys, OpenROAD, Python).

## Status

Modul dirilis bertahap. Daftar terbaru selalu ada di bagian **Belajar sekarang** di beranda situs. Tautan ke modul yang belum dibuat ditandai "segera".

## Struktur

| Folder | Isi |
|---|---|
| `src/` | Sumber halaman (`*.src.html`), komponen bersama `core.js` dan `core.css` (ICD-Core), dan `config.json` (Supabase dan repo) |
| `docs/` | Situs jadi hasil `tools/build.py`. Folder inilah yang disajikan GitHub Pages; jangan disunting langsung |
| `lab/` | Kode lab per modul, semuanya sudah dijalankan saat modul dibuat |
| `tools/` | Pembangun situs, uji Playwright, dan server tiruan Supabase untuk uji sinkron |
| `supabase/` | Skema database untuk fitur akun |

Membangun ulang situs:

```sh
python3 tools/build.py docs        # menyisipkan ICD-Core + config ke setiap halaman
python3 -m http.server 8000 --directory docs
```

Menjalankan uji:

```sh
npm install && npx playwright install chromium
mkdir -p shots && node tools/test.js && node tools/test_ui.js && node tools/test_m04c.js
```

## Mengaktifkan akun (opsional, untuk pengelola situs)

1. Buat project di [Supabase](https://supabase.com) (paket gratis cukup).
2. Di **SQL Editor**, jalankan isi `supabase/schema.sql`. Skema ini membuat tabel `progress` dengan Row Level Security, sehingga setiap orang hanya bisa membaca dan menulis datanya sendiri.
3. Atur **Authentication → URL Configuration**:
   - **Site URL:** `https://<username>.github.io/bikinchip/`
   - **Redirect URLs:** `https://<username>.github.io/bikinchip/**`
   - Tambahkan juga `http://localhost:8000/**` untuk pengembangan lokal.
4. Isi `src/config.json`:

   ```json
   { "supabaseUrl": "https://xxxx.supabase.co", "supabaseKey": "<kunci anon/publishable>", "repo": "<username>/bikinchip" }
   ```

   Kunci anon/publishable memang dirancang untuk publik; keamanan dijaga oleh RLS. **Jangan pernah** memasukkan kunci `service_role`/secret.
5. Aktifkan **Google** di **Authentication → Providers** (Client ID dan secret dari Google Cloud, redirect URI `https://<ref>.supabase.co/auth/v1/callback`), lalu tambahkan `"google": true` ke `config.json`.
6. Pastikan **Email** aktif dengan **Confirm email** menyala. Konfirmasi hanya diminta sekali saat mendaftar; setelah itu pengguna masuk dengan email dan kata sandi.
7. Untuk mewajibkan login, tambahkan `"requireLogin": true`. Halaman lain akan mengalihkan pengunjung yang belum masuk ke `masuk.html`; `masuk.html` dan `privasi.html` tetap publik.
8. Jalankan `python3 tools/build.py docs`, lalu commit.

Catatan:
- Login wajib hanya mengatur pengalaman pengguna, bukan keamanan materi. Materinya memang open source dan bisa dibaca di repositori.
- Versi offline (`file://`) tidak memakai akun dan tidak dikunci.

Menguji alur akun tanpa Supabase sungguhan (server tiruan):

```sh
echo '{"supabaseUrl":"http://127.0.0.1:8788","supabaseKey":"anon-test-key","google":true,"requireLogin":true}' > /tmp/cfg.json
cp src/config.json /tmp/cfg.bak && cp /tmp/cfg.json src/config.json && python3 tools/build.py /tmp/site2 && cp /tmp/cfg.bak src/config.json
node tools/mock_supabase.js /tmp/site2 &  node tools/test_auth.js
```

## Kontribusi

Koreksi materi, laporan bug, dan modul baru sangat diterima. Lihat [CONTRIBUTING.md](CONTRIBUTING.md).

## Lisensi

- Kode situs: [MIT](LICENSE).
- Materi pembelajaran: [CC BY-SA 4.0](LICENSE-MATERI.md). Bebas dipakai untuk kelas dan kampus, dengan atribusi dan lisensi yang sama untuk turunannya.
