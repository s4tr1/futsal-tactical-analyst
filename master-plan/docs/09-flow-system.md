# 15. Flow Sistem (System Flow)

> Dokumen ini menjelaskan alur kerja end-to-end FUTSIGHT: bagaimana data bergerak dari user (pelatih/pemain) melewati tiga komponen utama (Frontend, Backend, AI Worker) hingga kembali menjadi insight yang tampil di layar.

---

## 1. Gambaran Umum

FUTSIGHT terdiri dari tiga service yang saling terhubung:

| Service | Teknologi | Port | Tanggung Jawab |
|---|---|---|---|
| **Frontend** | React 19 + Vite + Tailwind 4 | `:5173` | UI, interaksi user, render chart & canvas |
| **Backend** | Laravel 13 + Sanctum + MySQL | `:8000` | REST API, auth, business logic, penyimpanan file |
| **AI Worker** | Python FastAPI + YOLOv8s + ByteTrack | `:8001` | Computer vision, tracking, auto-tagging, klip highlight |

```
User (Browser)
      │
      ▼
┌─────────────────┐   HTTP/JSON (Axios)   ┌─────────────────┐   Queue/HTTP   ┌─────────────────┐
│     Frontend    │ ───────────────────▶ │     Backend     │ ─────────────▶ │    AI Worker    │
│  React + Vite   │ ◀─────────────────── │  Laravel + MySQL│ ◀───────────── │   FastAPI       │
│     :5173       │                       │      :8000      │                │     :8001       │
└─────────────────┘                       └────────┬────────┘                └────────┬────────┘
                                                   │                                  │
                                                   ▼                                  ▼
                                            ┌──────────────┐                  ┌──────────────┐
                                            │   MySQL 8    │                  │  Model YOLOv8s│
                                            │ + Storage FS │                  │  + OpenCV    │
                                            └──────────────┘                  └──────────────┘
```

---

## 2. Flow Utama

### 2.1 Flow Autentikasi & Otorisasi

1. User membuka aplikasi → Frontend cek token di `AuthContext` (localStorage).
2. Belum ada token → redirect ke halaman `Login.jsx`.
3. `POST /api/login` → Backend validasi kredensial via Sanctum.
4. Sukses → token Bearer dikembalikan dan disimpan client.
5. Setiap request selanjutnya menyertakan header `Authorization: Bearer {token}`.
6. Semua endpoint protected di dalam group `auth:sanctum`; controller memverifikasi kepemilikan data via `Team::where('coach_id', ...)`.

> Peran: **Coach** dapat menulis (CRUD tim, pemain, match, event, video, taktik), **Player** hanya membaca (view).

### 2.2 Flow Pengelolaan Tim → Pemain → Match

1. Coach membuat **Team** (`POST /api/teams`).
2. Coach menambahkan **Player** ke tim (`POST /api/teams/{teamId}/players`).
3. Coach membuat **Match** (`POST /api/teams/{teamId}/matches`) dengan jadwal & skor.
4. Data disimpan ke tabel `teams`, `players`, `matches` dan langsung bisa diakses Dashboard.

### 2.3 Flow Upload Video

1. Coach membuka `VideoUpload.jsx`, drag & drop file (MP4/MOV/AVI, max 500MB).
2. Frontend `POST /api/matches/{matchId}/video` (multipart) ke Backend.
3. Backend memvalidasi file, mengganti video lama jika ada, lalu menyimpan ke `storage/app/public/videos/`.
4. Record dibuat di tabel `videos` dengan `tracking_status = 'none'`.
5. URL publik dikembalikan untuk player video.

### 2.4 Flow AI Tracking (inti aplikasi)

1. Coach klik **"Start AI Analysis"** → `POST /api/matches/{matchId}/tracking/queue`.
2. Backend memvalidasi: video harus ada & status tidak sedang `queued`/`processing`.
3. Backend set `tracking_status = 'queued'`, lalu dispatch job `TriggerAiTracking`.
4. Job (queue Laravel) melakukan `HTTP POST http://127.0.0.1:8001/process` ke AI Worker.
5. AI Worker set status `processing` → baca video frame-per-frame → YOLOv8s deteksi pemain & bola → ByteTrack assign `tracking_id` → batch insert ke `player_tracks` & `ball_tracks` (flush tiap 500 sample).
6. Selesai → status `tagging` → jalankan auto-tagger (`detect_events`) → insert event ke `match_events`.
7. Lanjut generate highlight (`clipper`) → insert record `highlights`.
8. Status final `done` (atau `failed` bila error, dengan `tracking_error`).
9. Frontend polling `GET .../tracking/status` untuk update progress bar.

### 2.5 Flow Live Tagging (Manual Event)

1. Coach membuka `LiveTagging.jsx`, jalankan video dengan timer sinkron.
2. Klik quick-tag `GOAL / SHOT / FOUL / TURNOVER`.
3. `POST /api/matches/{matchId}/events` → record `match_events` dengan timestamp menit/detik.
4. Event langsung tampil di event stream dan ikut masuk statistik.

### 2.6 Flow Statistik

1. `GET /api/matches/{matchId}/statistics` → `StatisticsController`.
2. Backend hitung dari `match_events` (distribusi tipe event) dan `player_tracks`/`ball_tracks` (possession, distance covered) bila tersedia.
3. Frontend `Statistics.jsx` render bar chart (Recharts) dan player box score.

### 2.7 Flow Tactical Board

1. Coach membuka `TacticalBoard.jsx` → canvas interaktif.
2. Drag token pemain, gambar arrow/zone/label → disimpan sebagai JSON.
3. `POST /api/matches/{matchId}/tactics` → tabel `tactics` (kolom `canvas_json`).
4. Opsional: `POST .../tracking/snapshot-to-tactic` mengubah data tracking frame tertentu menjadi taktik.
5. Playback animasi AI memuat data dari `.../tracking/playback`.

### 2.8 Flow Highlight

1. `GET /api/matches/{matchId}/highlights` → daftar klip.
2. `POST .../generate` → Backend panggil AI Worker `POST /highlights`.
3. AI Worker ambil event → potong video per momen kunci + gabung jadi reel.
4. Hasil disimpan di `highlights`, `GET /api/highlights/{id}/download` mengunduh MP4.

### 2.9 Flow PDF Report

1. Coach buka `Reports.jsx` → `GET /api/matches/{matchId}/report`.
2. `ReportController` render template HTML (statistik + event + taktik) via DomPDF.
3. Hasil PDF blob dikembalikan untuk diunduh.

---

## 3. State Machine `tracking_status`

```
none ──► queued ──► processing ──► tagging ──► done
                       │                       ▲
                       └────────► failed ◄─────┘
```

| Status | Arti |
|---|---|
| `none` | Belum pernah diproses |
| `queued` | Sudah masuk antrian, menunggu worker |
| `processing` | YOLOv8s + ByteTrack sedang berjalan |
| `tagging` | Auto-tagger sedang menganalisis event |
| `done` | Selesai (termasuk highlight) |
| `failed` | Gagal, detail di `tracking_error` |

---

## 4. Urutan End-to-End (Ringkasan)

```
Login ──► Buat Tim ──► Tambah Pemain ──► Buat Match ──► Upload Video
                                                              │
                                                              ▼
                                              Start AI Analysis (queue)
                                                              │
                                                              ▼
                                            AI Worker: Detection → Tracking
                                                              │
                                                              ▼
                                            Simpan player_tracks / ball_tracks
                                                              │
                                          ┌───────────────────┴───────────────────┐
                                          ▼                                       ▼
                                    Auto-tag Events                     Generate Highlights
                                          │                                       │
                                          ▼                                       ▼
                                    match_events                          highlights (MP4)
                                          │                                       │
                                          └───────────────────┬───────────────────┘
                                                              ▼
                                    Statistics / Heatmap / Playback / Tactic Snapshot
                                                              │
                                                              ▼
                                                  PDF Report (DomPDF)
```

---

## 5. Arah Komunikasi Antar Service

| Dari | Ke | Metode | Tujuan |
|---|---|---|---|
| Frontend | Backend | HTTP REST (Axios) | CRUD + baca data |
| Backend | AI Worker | HTTP POST (via `TriggerAiTracking` job) | Trigger proses video & highlight |
| AI Worker | MySQL | Direct (PyMySQL) | Batch insert tracking/event/highlight |
| Frontend | Backend | HTTP polling | Cek status tracking & progress |
