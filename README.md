<p align="center">
  <picture>
    <img src="https://img.shields.io/badge/FUTSIGHT-Futsal%20Tactical%20Analyst-8b5cf6?style=for-the-badge&labelColor=070510" height="60" alt="FUTSIGHT" />
  </picture>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-13.8-FF2D20?style=flat-square&logo=laravel&logoColor=white" />
  <img src="https://img.shields.io/badge/PHP-8.3+-777BB4?style=flat-square&logo=php&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv8s-Object%20Detection-00FFFF?style=flat-square&logo=yolo&logoColor=black" />
  <img src="https://img.shields.io/badge/OpenCV-4.10-5C3EE8?style=flat-square&logo=opencv&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/license-internal-red?style=flat-square" />
  <img src="https://img.shields.io/badge/status-active-success?style=flat-square" />
</p>

<br />

---

## Tentang FUTSIGHT

FUTSIGHT adalah platform analisis taktik futsal berbasis web yang menggabungkan **AI-powered player tracking**, **live event tagging**, **automatic highlight generation**, **tactical board interaktif**, dan **PDF report generation** dalam satu sistem terintegrasi. Dirancang untuk pelatih dan analis futsal yang membutuhkan insight mendalam dari rekaman pertandingan.

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    FUTSIGHT System                       │
├──────────────┬──────────────────────┬───────────────────┤
│   Frontend   │       Backend        │    AI Worker      │
│  React + Vite│   Laravel REST API   │  Python FastAPI   │
│  Tailwind 4  │   Sanctum + MySQL    │  YOLOv8 + OpenCV  │
│   :5173      │       :8000          │      :8001        │
└──────────────┴──────────────────────┴───────────────────┘
```

---

## Tech Stack

### Frontend
<p>
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Router-7.18-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" />
  <img src="https://img.shields.io/badge/Recharts-3.10-22B5BF?style=for-the-badge&logo=recharts&logoColor=white" />
  <img src="https://img.shields.io/badge/Axios-1.19-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
  <img src="https://img.shields.io/badge/Lucide-1.30-F56565?style=for-the-badge&logo=lucide&logoColor=white" />
</p>

### Backend
<p>
  <img src="https://img.shields.io/badge/Laravel-13.8-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" />
  <img src="https://img.shields.io/badge/PHP-8.3+-777BB4?style=for-the-badge&logo=php&logoColor=white" />
  <img src="https://img.shields.io/badge/Sanctum-Auth-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" />
  <img src="https://img.shields.io/badge/DomPDF-PDF-00599C?style=for-the-badge&logo=adobeacrobatreader&logoColor=white" />
</p>

### AI & Computer Vision
<p>
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv8s-Detection-00FFFF?style=for-the-badge&logo=yolo&logoColor=black" />
  <img src="https://img.shields.io/badge/OpenCV-4.10-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" />
  <img src="https://img.shields.io/badge/ByteTrack-Tracking-FF6F00?style=for-the-badge" />
  <img src="https://img.shields.io/badge/NumPy-1.26-013243?style=for-the-badge&logo=numpy&logoColor=white" />
</p>

### Database & Storage
<p>
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-Dev-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
</p>

---

## Fitur Utama

| | | | |
|---|---|---|---|
| 🏠 **Dashboard** | Statistik performa tim, win rate, goal per match, quick action tools | ⚡ **Live Tagging** | Timer, quick-tag GOAL/SHOT/FOUL/TURNOVER, sync video |
| 🎯 **AI Tracking** | YOLOv8s detection + ByteTrack multi-object tracking pemain & bola | 🎬 **Highlights** | Auto-clip momen kunci + full highlight reel, download MP4 |
| 📋 **Tactical Board** | Canvas interaktif, drag token, arrow/zone/label, playback animasi AI | 📊 **Statistics** | Bar chart distribusi event, player box score, metrik pertandingan |
| 📄 **PDF Report** | Generate laporan profesional via DomPDF + download | 📹 **Video Upload** | Drag & drop upload (max 500MB), progress bar |
| 👥 **Team Roster** | CRUD pemain, jersey number, posisi futsal | ⚽ **Match Registry** | Jadwal, skor, status pertandingan, filter upcoming/finished |

---

## Prasyarat

| Dependency | Version | Notes |
|---|---|---|
| PHP | `>= 8.3` | + Composer |
| Node.js | `>= 18` | + npm |
| Python | `>= 3.10` | Untuk AI worker |
| MySQL | `8` | Atau SQLite untuk dev |
| YOLOv8s | model | Letakkan di `ai-worker/models/yolov8s.pt` |

---

## Quick Start

### 1. Clone & Backend

```bash
git clone https://github.com/s4tr1/futsal-tactical-analyst.git
cd futsal-tactical-analyst/backend

composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed   # Reset + seed akun demo
php artisan storage:link
php artisan serve                  # http://127.0.0.1:8000
```

> **Demo login:** `analyst@team.com` · `password`

### 2. Frontend

```bash
cd ../frontend
npm install
npm run dev                        # http://localhost:5173
```

Vite memproksi `/api` dan `/storage` ke backend Laravel otomatis.

### 3. AI Worker

```bash
cd ../ai-worker
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

---

## API Reference

### Public
| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/api/register` | Registrasi |
| `POST` | `/api/login` | Login (rate-limit 5/min) |

### Protected `Authorization: Bearer {token}`

<table>
<tr><th>Module</th><th>Endpoints</th></tr>
<tr><td>Auth</td><td>

`POST /api/logout` · `GET /api/me`

</td></tr>
<tr><td>Teams</td><td>

`GET /api/teams` · `POST /api/teams`

</td></tr>
<tr><td>Players</td><td>

`GET /api/teams/{teamId}/players` · `POST /api/teams/{teamId}/players` · `PUT /api/players/{id}` · `DELETE /api/players/{id}`

</td></tr>
<tr><td>Matches</td><td>

`GET /api/teams/{teamId}/matches` · `POST /api/teams/{teamId}/matches` · `GET /api/matches/{id}` · `PUT /api/matches/{id}` · `DELETE /api/matches/{id}`

</td></tr>
<tr><td>Events</td><td>

`GET /api/matches/{matchId}/events` · `POST /api/matches/{matchId}/events` · `DELETE /api/events/{id}`

</td></tr>
<tr><td>Statistics</td><td>

`GET /api/matches/{matchId}/statistics`

</td></tr>
<tr><td>Video</td><td>

`GET /api/matches/{matchId}/video` · `POST /api/matches/{matchId}/video`

</td></tr>
<tr><td>Tactics</td><td>

`GET /api/matches/{matchId}/tactics` · `POST /api/matches/{matchId}/tactics` · `GET /api/tactics/{id}` · `DELETE /api/tactics/{id}`

</td></tr>
<tr><td>Report</td><td>

`GET /api/matches/{matchId}/report` → PDF blob

</td></tr>
<tr><td>Tracking</td><td>

`POST /api/matches/{matchId}/tracking/queue` · `GET .../status` · `GET .../players` · `GET .../ball` · `GET .../heatmap` · `GET .../summary` · `GET .../playback` · `POST .../snapshot-to-tactic`

</td></tr>
<tr><td>Highlights</td><td>

`GET /api/matches/{matchId}/highlights` · `POST .../generate` · `GET /api/highlights/{id}/download`

</td></tr>
</table>

### AI Worker
| Method | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/process` | Detection → Tracking → Auto-tagging → Clip |
| `POST` | `/highlights` | Reel generation on-demand |

---

## Database Schema

```
users ──┬── 1:* ── teams ── 1:* ── matches ── 1:* ── match_events
        │                                    ├── 1:1 ── videos
        │                                    ├── 1:* ── tactics
        │                                    ├── 1:* ── player_tracks
        │                                    ├── 1:* ── ball_tracks
        │                                    └── 1:* ── highlights
        └── 1:* ── players (via team)
```

<details>
<summary>12 tabel aplikasi (klik untuk detail)</summary>

| Tabel | Deskripsi |
|---|---|
| `users` | Akun coach & player (role-based) |
| `teams` | Tim futsal + coach |
| `players` | Roster pemain (nama, #jersey, posisi) |
| `matches` | Jadwal, skor, status pertandingan |
| `match_events` | GOAL / SHOT / FOUL / TURNOVER |
| `videos` | Upload video + status AI tracking |
| `player_tracks` | x, y, confidence, team per frame (AI) |
| `ball_tracks` | x, y, confidence per frame (AI) |
| `tactics` | Canvas JSON (token, arrow, zone) |
| `highlights` | Klip video hasil AI/manual |

</details>

---

## Struktur Proyek

```
futsal-tactical-analyst/
│
├── frontend/                     React 19 SPA
│   └── src/
│       ├── components/           Sidebar, Topbar
│       ├── pages/                10 halaman (Dashboard → Highlights)
│       ├── context/              AuthContext
│       ├── api.js                Axios client
│       └── index.css             Tailwind v4 theme
│
├── backend/                      Laravel 13 API
│   ├── app/Http/Controllers/     14 controller
│   ├── app/Models/               Eloquent models
│   ├── app/Jobs/                 TriggerAiTracking
│   ├── database/migrations/      15 migration
│   └── routes/api.php            50+ endpoint
│
├── ai-worker/                    Python AI service
│   ├── main.py                   FastAPI server (:8001)
│   ├── detector.py               YOLOv8s inference
│   ├── tracker.py                ByteTrack
│   ├── clipper.py                Highlight clipping
│   ├── auto_tagger.py            Event detection
│   ├── db.py                     MySQL batch writer
│   └── models/                   Model files
│
└── master-plan/docs/             Dokumentasi teknis
    00-overview  ·  01-requirements  ·  02-architecture
    03-database-schema  ·  04-api-endpoints  ·  05-workflow
    06-testing  ·  07-roadmap  ·  08-ai-tracking-plan
```

---

<p align="center">
  <sub>Built with ❤️ for futsal coaches · Internal Use · Authorized Personnel Only</sub>
</p>
