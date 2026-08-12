# FUTSIGHT — Futsal Tactical Analyst

Platform analisis taktik futsal berbasis web dengan AI-powered player tracking, live event tagging, automatic highlight generation, tactical board interaktif, dan PDF report generation.

## Arsitektur

```
futsal-tactical-analyst/
├── frontend/     React 19 + Vite 8 + Tailwind CSS 4
├── backend/      Laravel 13.8 REST API (PHP 8.3+)
├── ai-worker/    Python FastAPI + YOLOv8s + OpenCV
└── master-plan/  Dokumentasi perencanaan & arsitektur
```

## Teknologi

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7, Recharts, Axios, Lucide Icons |
| Backend | Laravel 13.8, Sanctum Auth, MySQL/SQLite, DomPDF, Queue Jobs |
| AI | Python FastAPI, YOLOv8s, OpenCV, ByteTrack, NumPy, PyMySQL |
| Database | MySQL / SQLite |

## Fitur Utama

- **Manajemen Tim & Pemain** — roster, jersey number, posisi (Kiper/Flank/Pivot/Anchor)
- **Manajemen Pertandingan** — jadwal, skor, kompetisi, status (scheduled/live/finished)
- **Live Event Tagging** — timer pertandingan, quick-tag event (GOAL/SHOT/FOUL/TURNOVER), sync dengan video player
- **AI Player & Ball Tracking** — YOLOv8s object detection + ByteTrack multi-object tracking, queue-based processing
- **Automatic Event Tagging** — auto-deteksi gol, shot, foul, turnover dari data tracking
- **Highlight Generator** — auto-clip momen penting + full highlight reel, download per clip
- **Tactical Board Interaktif** — drag & drop token pemain, draw arrow/zone/label, simpan canvas JSON, playback animasi tracking AI
- **Match Statistics** — metrik pertandingan, player box score, bar chart distribusi event
- **PDF Report** — laporan pertandingan profesional (DomPDF)
- **Video Upload** — drag & drop upload video pertandingan (max 500MB)

## Prasyarat

- PHP 8.3+
- Composer
- Node.js 18+
- Python 3.10+ (untuk AI worker)
- MySQL 8 (atau SQLite untuk development)
- YOLOv8s model (`ai-worker/models/yolov8s.pt`)

## Setup Development

### 1. Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Konfigurasi database di .env (default SQLite, bisa diganti MySQL)
php artisan migrate:fresh --seed
```

Default login: `analyst@team.com` / `password`

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`, proxy `/api` ke backend Laravel di `http://127.0.0.1:8000`.

### 3. AI Worker (Python)

```bash
cd ai-worker
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Pastikan models/yolov8s.pt tersedia
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

### 4. Storage Link

```bash
cd backend
php artisan storage:link
```

## API Endpoints

### Public
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/register` | Registrasi user |
| POST | `/api/login` | Login (rate-limited 5/min) |

### Protected (Bearer Token)
| Resource | Endpoints |
|---|---|
| Auth | `POST /api/logout`, `GET /api/me` |
| Teams | `GET/POST /api/teams` |
| Players | `GET/POST /api/teams/{teamId}/players`, `PUT/DELETE /api/players/{id}` |
| Matches | `GET/POST /api/teams/{teamId}/matches`, `GET/PUT/DELETE /api/matches/{id}` |
| Events | `GET/POST /api/matches/{matchId}/events`, `DELETE /api/events/{id}` |
| Statistics | `GET /api/matches/{matchId}/statistics` |
| Video | `GET/POST /api/matches/{matchId}/video` |
| Tactics | `GET/POST /api/matches/{matchId}/tactics`, `GET/DELETE /api/tactics/{id}` |
| Report | `GET /api/matches/{matchId}/report` (PDF blob) |
| Tracking | `POST /queue`, `GET /status`, `GET /players`, `GET /ball`, `GET /heatmap`, `GET /summary`, `GET /playback`, `POST /snapshot-to-tactic` |
| Highlights | `GET /api/matches/{matchId}/highlights`, `POST /generate`, `GET /api/highlights/{id}/download` |

## AI Worker Endpoints

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/process` | Full pipeline: detection → tracking → auto-tagging → clip generation |
| POST | `/highlights` | On-demand highlight reel generation |

## Database Schema

12 tabel aplikasi utama:
- `users` — akun coach & player
- `teams` — tim dengan coach
- `players` — roster pemain per tim
- `matches` — jadwal & hasil pertandingan
- `match_events` — event GOAL/SHOT/FOUL/TURNOVER
- `videos` — recording pertandingan + status AI tracking
- `player_tracks` — hasil tracking posisi pemain AI
- `ball_tracks` — hasil tracking posisi bola AI
- `tactics` — canvas JSON tactical board
- `highlights` — klip highlight hasil AI/manual

## Struktur Proyek

```
backend/
├── app/Http/Controllers/    # REST API controllers
├── app/Models/              # Eloquent models
├── app/Jobs/                # Queue jobs (AI tracking)
├── database/migrations/     # 15 migration files
├── routes/api.php           # API route definitions
└── storage/app/public/      # Uploaded media

frontend/src/
├── components/    Sidebar, Topbar
├── pages/         Login, Dashboard, Matches, LiveTagging, TacticalBoard,
│                  VideoUpload, Statistics, Reports, Highlights, Players
├── context/       AuthContext (React Context)
├── api.js         Axios client + interceptors
└── index.css      Tailwind v4 theme + custom CSS

ai-worker/
├── main.py        FastAPI server
├── detector.py    YOLOv8s detection
├── tracker.py     ByteTrack multi-object tracking
├── db.py          MySQL batch insert
├── clipper.py     Video highlight clipping
├── auto_tagger.py Automatic event detection
└── models/        YOLO model files

master-plan/docs/  Planning documents (architecture, schema, workflow, testing)
```

## Lisensi

Internal use — Authorized Personnel Only.
