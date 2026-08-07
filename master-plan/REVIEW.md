# Review & Koreksi Masterplan

## ✅ Yang Sudah Kuat
- Struktur dokumen lengkap: overview → objectives → scope → roles → requirements → architecture → database → tech stack → workflow → timeline → task breakdown → testing → risk → safety → roadmap → deliverables → success criteria.
- Scope MVP vs Future Roadmap dipisah dengan jelas — bagus untuk mencegah scope creep di project 4 minggu.
- Role-based requirement (Coach vs Player) sudah jelas dari sisi hak akses fitur.
- Ada **Hardware Safety Plan** — jarang ditemukan di project plan mahasiswa, menunjukkan kesadaran teknis yang matang (RAM budget, suhu laptop, hindari training AI berat).
- Risk assessment sudah mencakup risiko teknis maupun non-teknis (jadwal, git conflict).

## ⚠️ Gap yang Perlu Diperjelas Sebelum Mulai Coding

### 1. Database Schema (Kritis)
Draft awal hanya menyebut nama tabel & relasi tingkat tinggi, belum ada kolom, tipe data, dan foreign key. Ini **wajib** ada sebelum migration ditulis, karena kesalahan skema di awal akan menular ke semua modul lain. → Sudah dibuatkan draft di `03-database-schema.md`.

### 2. API Endpoint List (Kritis)
Belum ada daftar endpoint sama sekali. Tanpa ini, frontend dan backend akan sulit dikembangkan paralel (React butuh tahu kontrak API-nya). → Sudah dibuatkan draft di `04-api-endpoints.md`.

### 3. Alur Onboarding Player
Belum dijelaskan bagaimana seorang Player bergabung ke Team — apakah lewat kode undangan, email invite, atau didaftarkan manual oleh Coach? Ini mempengaruhi desain tabel `users` dan flow registrasi.
**Rekomendasi:** Untuk MVP, sederhanakan: Coach yang mendaftarkan Player secara manual (tanpa self-register), Player login pakai akun yang dibuatkan Coach.

### 4. Match Lifecycle & Aturan Futsal
Belum ada field status pertandingan (`scheduled` / `live` / `finished`) dan belum menyebut durasi babak futsal standar (2×20 menit) untuk keperluan timestamp event per babak.
**Rekomendasi:** Tambahkan field `status` dan `half` (1/2) di tabel `matches` dan `match_events` — sudah dimasukkan ke draft skema.

### 5. Definisi "Possession Estimation"
Ini istilah yang berpotensi menyesatkan kalau tidak didefinisikan. Tanpa video tracking posisi bola/pemain, "possession" sebenarnya **tidak bisa dihitung secara akurat** — yang bisa dihitung hanyalah estimasi kasar dari rasio event (misal: jumlah shot + turnover per tim).
**Rekomendasi:** Ganti nama metrik menjadi **"Estimated Ball Control Index"** atau jelaskan eksplisit di UI bahwa ini estimasi berbasis event, bukan tracking real.

### 6. Tactical Board — Pilihan Library
Belum ditentukan library canvas yang dipakai (mis. `react-konva`, `fabric.js`, atau native SVG/Canvas API). Ini penting ditentukan sebelum Week 3 karena mempengaruhi format penyimpanan data taktik (JSON canvas state).
**Rekomendasi:** `react-konva` — ringan, populer, dan cocok untuk drag-and-drop token pemain + panah.

### 7. Struktur Isi Laporan PDF
Belum ada wireframe/daftar section yang masuk ke laporan PDF. Minimal harus ditentukan urutan section: Header (info match) → Skor & Ringkasan → Statistik → Timeline Event → Tactical Snapshot → Footer.

### 8. Automated Testing
Rencana testing saat ini murni manual (tabel skenario). Untuk portfolio yang lebih meyakinkan, disarankan menambah **unit test dasar** (PHPUnit) minimal untuk: Auth, Match CRUD, dan Statistics calculation — karena ini bagian yang paling sering jadi sumber bug tersembunyi.

### 9. Security Detail
CSRF & password hashing sudah disebut, tapi belum ada:
- Rate limiting untuk endpoint login (mencegah brute force)
- Laravel Policy/Gate untuk memastikan Player tidak bisa mengakses endpoint milik Coach
- Validasi ukuran & tipe file video di sisi backend (bukan hanya frontend)

### 10. Timeline Week 4 Terlalu Padat
Minggu terakhir mencakup: PDF report + testing + bug fixing + documentation + GitHub cleanup + demo recording — cukup berat untuk 1 minggu solo project.
**Rekomendasi:** Geser pembuatan PDF service ke akhir Week 3 (sudah cukup matang secara data di titik itu), sehingga Week 4 fokus penuh ke testing, dokumentasi, dan demo.

### 11. Seed / Dummy Data
Belum ada task khusus untuk membuat database seeder. Ini penting supaya demo & testing tidak butuh input manual berulang setiap kali reset database.
**Rekomendasi:** Tambahkan task "Buat Seeder (dummy team, players, 1 match lengkap dengan event)" di Week 1 akhir atau awal Week 2.

## Ringkasan Prioritas
Kalau waktu terbatas, urutan yang paling penting untuk diperjelas dulu sebelum mulai coding:
1. Database schema detail (sudah dibuatkan)
2. API endpoint list (sudah dibuatkan)
3. Alur onboarding Player
4. Definisi ulang "possession estimation"
5. Pilihan library tactical board
