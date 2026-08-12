# 16. Flow Arsitektur & Model Workflow

> Dokumen ini menjelaskan arsitektur aliran data (data flow) antar layer, serta workflow model AI (Computer Vision pipeline) secara detail.

---

## 1. Arsitektur Tiga Layer (Three-Tier)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                │
│                         Frontend (React 19 + Vite)                          │
│   pages/: Dashboard, LiveTagging, Matches, Players, Statistics,             │
│           TacticalBoard, VideoUpload, Highlights, Reports, Login            │
│   context/AuthContext · api.js (Axios client) · components/                 │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ HTTP/JSON (Bearer Token)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION LAYER                                │
│                          Backend (Laravel 13 API)                           │
│   Controllers: Auth, Team, Player, Match, MatchEvent, Statistics,           │
│                Video, Tactic, Report, Tracking, Highlight                   │
│   Jobs: TriggerAiTracking · Models: Eloquent · Sanctum Auth · DomPDF        │
└───────────────┬──────────────────────────────────────┬──────────────────────┘
                │                                      │
                │ (Query Eloquent)                     │ (HTTP POST via Job)
                ▼                                      ▼
┌───────────────────────────────┐        ┌─────────────────────────────────────┐
│        DATA LAYER             │        │           AI WORKER LAYER           │
│     MySQL 8 + Storage FS      │◄───────│  FastAPI + YOLOv8s + ByteTrack      │
│  users, teams, players,       │  batch │  detector · tracker · auto_tagger   │
│  matches, match_events,       │  write │  clipper · postprocess · db         │
│  videos, player_tracks,       │ (PyMy- │                                     │
│  ball_tracks, tactics,        │  SQL)  │                                     │
│  highlights                   │        │                                     │
└───────────────────────────────┘        └─────────────────────────────────────┘
```

### Prinsip Desain
- **Frontend tidak pernah berkomunikasi langsung ke AI Worker.** Semua request dilewatkan Backend (Backend bertindak sebagai gateway & pengatur otorisasi).
- **AI Worker menulis langsung ke MySQL** (via `db.py`) karena menghasilkan volume data tracking yang besar (batch insert lebih efisien daripada round-trip lewat HTTP).
- **Backend dan AI Worker berbagi satu database** yang sama; Backend membaca hasil tracking untuk statistik/heatmap/playback.

---

## 2. Data Flow Detail per Fitur

### 2.1 Read Path (Umum)
```
React component ──► api.js (Axios, Bearer) ──► Laravel route ──► Controller
        ▲                                                                 │
        └──────────────── JSON response ◀──────────────── Eloquent ◀ MySQL
```

### 2.2 Write Path (CRUD)
```
React form ──► Axios POST/PUT ──► Controller validate ──► Policy/Coach check
        ▲                                                       │
        └───────────── JSON response ◀── Eloquent save ◀───────┘
```

### 2.3 Async Write Path (AI Tracking)
```
React "Start AI" ──► TrackingController@queue ──► videos.status = queued
                                                      │
                                                      ▼
                                      TriggerAiTracking job (queue)
                                                      │
                                        HTTP POST :8001/process
                                                      │
                                                      ▼
                                    AI Worker (deteksi + tracking)
                                                      │
                                        batch INSERT player/ball_tracks
                                                      │
                                                      ▼
                                    auto_tagger + clipper + status done
```

---

## 3. Model Workflow — AI Worker (Computer Vision Pipeline)

Pipeline utama dijalankan oleh `ai-worker/main.py` (endpoint `POST /process`).

### 3.1 Tahapan Pipeline

```
Video MP4 (storage)
        │
        ▼
┌─────────────────────┐
│ 1. Load & Probe     │  cv2.VideoCapture → ambil FPS & total frame
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 2. Frame Sampling   │  Proses frame tiap FRAME_SAMPLE_RATE (default 5)
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 3. Detection        │  detector.py → YOLOv8s (input 640×640, batch=1, GPU)
│                     │  Output: class 'player' | 'ball' + bbox + confidence
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 4. Tracking         │  tracker.py → ByteTrack (IoU matching)
│                     │  Assign tracking_id konsisten per pemain
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 5. Batch Persist    │  db.py → batch INSERT (flush tiap 500 sample)
│                     │  → player_tracks, ball_tracks
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 6. Auto-Tagging     │  auto_tagger.py → deteksi event (goal) dari posisi bola
│                     │  → INSERT ke match_events
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 7. Highlight Clip   │  clipper.py → potong klip per event + gabung reel
│                     │  → INSERT ke highlights
└──────────┬──────────┘
           ▼
      status = done
```

### 3.2 Detail Modul `ai-worker/`

| File | Peran | Key function |
|---|---|---|
| `main.py` | Entry point FastAPI | `POST /process`, `POST /highlights`, `GET /health` |
| `detector.py` | Inferensi YOLOv8s | `detect(frame)` → list deteksi |
| `tracker.py` | ByteTrack wrapper | `update(detections, frame_number)` |
| `auto_tagger.py` | Rule-based event detection | `detect_events(...)` |
| `clipper.py` | Potong & gabung highlight | `generate_highlights(...)` |
| `postprocess.py` | Heatmap, possession, trail | `generate_heatmap`, `calculate_possession` |
| `db.py` | MySQL batch writer | `insert_player_tracks_batch`, dst. |
| `config.py` | Konfigurasi | `MODEL_PATH`, `STORAGE_BASE`, `FRAME_SAMPLE_RATE`, port |

### 3.3 Auto-Tagging Logic (`auto_tagger.py`)

Bekerja murni berbasis rule dari posisi bola (tanpa training tambahan):

```
Baca ball_tracks → kelompokkan per frame → urutkan frame
        │
        ▼
Bandingkan 3 frame berurutan (f_prev2, f_prev, f_curr)
        │
        ▼
Bola masuk zona gawang (y <= 0.35 atau y >= 0.65) ?
        │  ya & confidence > 0.5
        ▼
Buat event_type = 'goal' + timestamp (menit/detik)
```

> Saat ini auto-tagger fokus pada deteksi **goal**. Tipe event lain (shot, foul, turnover) masih manual via Live Tagging — roadmap pengembangan lanjutan.

### 3.4 Highlight Clipping (`clipper.py`)

```
match_events (GOAL, SHOT, dll) ──► potong segmen ±N detik di sekitar timestamp
        │
        ▼
kumpulkan klip ──► gabung jadi satu reel (full highlight)
        │
        ▼
simpan file ke storage/highlights + INSERT tabel highlights
```

---

## 4. Alur Sinkronisasi Status

Karena proses AI bersifat **async** (offline batch, 8–12 menit untuk video 90 menit), status disinkronkan lewat kolom `videos.tracking_status`:

```
Backend (job)            AI Worker                     MySQL (videos.tracking_status)
     │                       │                                     │
     ├── queue ──────────────┼─────────────────────────────────────► queued
     │                       │                                     │
     │                       ├── /process diterima ────────────────► processing
     │                       ├── flush batch / progress ──────────► processing (+progress)
     │                       ├── tracking selesai ────────────────► tagging
     │                       ├── auto-tag + clip selesai ─────────► done
     │                       └── error ──────────────────────────► failed (+tracking_error)
```

Frontend melakukan **polling** `GET .../tracking/status` untuk memantau status dan progress bar.

---

## 5. Ketergantungan Antar Komponen

```
React (Vite) ──► depends ──► Laravel API (Sanctum token, REST endpoint)
Laravel API ───► depends ──► MySQL (persistence) + Storage (file)
Laravel API ───► depends ──► AI Worker (HTTP :8001) [via job]
AI Worker ─────► depends ──► YOLOv8s model file + Storage (baca video)
AI Worker ─────► depends ──► MySQL (tulis tracking/event/highlight)
```

---

## 6. Kontrak Data antar Layer

| Layer Pengirim | Layer Penerima | Format | Contoh |
|---|---|---|---|
| Frontend | Backend | JSON (REST) | `POST /api/matches/1/events` |
| Backend | AI Worker | JSON (POST body) | `{ match_id, video_path }` |
| AI Worker | MySQL | Batch INSERT | `player_tracks` rows |
| Backend | Frontend | JSON | `{ success, data: {...} }` |

> Format response Backend konsisten: `{ success: bool, data: ..., message: ... }`.
