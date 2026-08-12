# 17. Flowchart

> Kumpulan flowchart (Mermaid) untuk setiap proses penting di FUTSIGHT. Diagram dapat dirender langsung di GitHub/GitLab/VSCode dengan plugin Mermaid.

---

## 1. Flowchart Sistem Keseluruhan

```mermaid
flowchart TD
    A[User / Pelatih] -->|Login| B[Frontend React]
    B -->|REST API + Bearer| C[Backend Laravel]
    C -->|Eloquent| D[(MySQL)]
    C -->|Storage| E[(File Storage)]
    C -->|TriggerAiTracking Job| F[AI Worker FastAPI]
    F -->|YOLOv8s + ByteTrack| F
    F -->|Batch INSERT| D
    F -->|Baca video| E
    F -->|Auto-tag| D
    F -->|Clip highlight| E
    C -->|DomPDF| G[PDF Report]
    B -->|Render chart/canvas| H[Dashboard / Stats / Tactical Board]
```

---

## 2. Flowchart Autentikasi

```mermaid
flowchart TD
    A[Mulai] --> B{Buka Aplikasi}
    B --> C{Token di localStorage?}
    C -->|Ya| D[Load AuthContext]
    C -->|Tidak| E[Tampilkan Login.jsx]
    E --> F[POST /api/login]
    F --> G{Valid?}
    G -->|Tidak| E
    G -->|Ya| H[Simpan Bearer Token]
    H --> D
    D --> I[Request selanjutnya pakai Authorization header]
    I --> J{Coach atau Player?}
    J -->|Coach| K[Full CRUD]
    J -->|Player| L[Read-only]
```

---

## 3. Flowchart Upload Video

```mermaid
flowchart TD
    A[Mulai] --> B[Buka VideoUpload.jsx]
    B --> C[Drag & drop file]
    C --> D{Validasi format<br/>mp4/mov/avi, max 500MB?}
    D -->|Tidak| E[Tampilkan error]
    E --> B
    D -->|Ya| F[POST /api/matches/id/video multipart]
    F --> G{Video lama ada?}
    G -->|Ya| H[Hapus video lama + record]
    G -->|Tidak| I[Store ke storage/public/videos]
    H --> I
    I --> J[Insert tabel videos, status=none]
    J --> K[Kembalikan URL video]
    K --> L[Selesai]
```

---

## 4. Flowchart AI Tracking (End-to-End)

```mermaid
flowchart TD
    A[Coach klik Start AI Analysis] --> B[POST /tracking/queue]
    B --> C{Video sudah ada?}
    C -->|Tidak| D[Error: upload video dulu]
    C -->|Ya| E{Status queued/processing?}
    E -->|Ya| F[Error 409: sedang berjalan]
    E -->|Tidak| G[status = queued]
    G --> H[Dispatch TriggerAiTracking job]
    H --> I[HTTP POST :8001/process]
    I --> J[AI Worker: status = processing]
    J --> K[Loop frame video]
    K --> L{frame % sample_rate == 0?}
    L -->|Tidak| K
    L -->|Ya| M[YOLOv8s detect pemain & bola]
    M --> N[ByteTrack assign tracking_id]
    N --> O[Batch insert player/ball tracks]
    O --> P{Flush tiap 500?}
    P -->|Ya| Q[commit ke MySQL]
    Q --> K
    P -->|Tidak| K
    K -->|Video habis| R[status = tagging]
    R --> S[Auto-tagger detect events]
    S --> T[Insert match_events]
    T --> U[Generate highlight clips + reel]
    U --> V[Insert highlights]
    V --> W[status = done]
    I -->|error| X[status = failed + tracking_error]
```

---

## 5. Flowchart Auto-Tagging (Goal Detection)

```mermaid
flowchart TD
    A[Mulai] --> B[Baca ball_tracks]
    B --> C{Jumlah titik >= 3?}
    C -->|Tidak| D[Return kosong]
    C -->|Ya| E[Kelompokkan per frame & urutkan]
    E --> F[Ambil 3 frame berurutan f_prev2, f_prev, f_curr]
    F --> G{Bola masuk zona gawang?<br/>y <= 0.35 atau y >= 0.65}
    G -->|Tidak| F
    G -->|Ya| H{Confidence > 0.5?}
    H -->|Tidak| F
    H -->|Ya| I[Hitung menit & detik]
    I --> J[Buat event_type = goal]
    J --> K{Ada frame lain?}
    K -->|Ya| F
    K -->|Tidak| L[Kembalikan daftar events]
    L --> M[Insert ke match_events]
    M --> N[Selesai]
```

---

## 6. Flowchart Live Tagging (Manual Event)

```mermaid
flowchart TD
    A[Buka LiveTagging.jsx] --> B[Play video + start timer]
    B --> C[Coach klik quick-tag]
    C --> D{Tag apa?}
    D -->|GOAL| E1[event_type = goal]
    D -->|SHOT| E2[event_type = shot]
    D -->|FOUL| E3[event_type = foul]
    D -->|TURNOVER| E4[event_type = turnover]
    E1 --> F[POST /api/matches/id/events]
    E2 --> F
    E3 --> F
    E4 --> F
    F --> G[Insert match_events dengan menit/detik]
    G --> H[Tampil di event stream]
    H --> I{Tag lagi?}
    I -->|Ya| C
    I -->|Tidak| J[Selesai]
```

---

## 7. Flowchart Statistik

```mermaid
flowchart TD
    A[GET /api/matches/id/statistics] --> B[StatisticsController]
    B --> C[Baca match_events]
    C --> D[Hitung distribusi tipe event]
    B --> E{Ada data tracking?}
    E -->|Ya| F[Hitung ball possession]
    F --> G[Hitung distance covered]
    G --> H[Generate heatmap grid]
    H --> I[Gabungkan semua metrik]
    E -->|Tidak| I
    D --> I
    I --> J[Response JSON]
    J --> K[Statistics.jsx render Recharts + box score]
```

---

## 8. Flowchart Tactical Board

```mermaid
flowchart TD
    A[Buka TacticalBoard.jsx] --> B[Canvas interaktif]
    B --> C[Drag token pemain]
    C --> D[Gambar arrow / zone / label]
    D --> E{Simpan?}
    E -->|Ya| F[Serialize canvas ke JSON]
    F --> G[POST /api/matches/id/tactics]
    G --> H[Insert tabel tactics.canvas_json]
    E -->|Tidak| B
    B --> I{Sumber lain?}
    I -->|Snapshot AI| J[POST /tracking/snapshot-to-tactic]
    J --> K[Ubah tracking frame jadi token]
    K --> G
    I -->|Playback| L[GET /tracking/playback]
    L --> M[Animasikan token per frame]
```

---

## 9. Flowchart Highlight Generation

```mermaid
flowchart TD
    A[Mulai] --> B[GET /api/matches/id/highlights]
    B --> C{Perlu generate baru?}
    C -->|Ya| D[POST .../generate]
    C -->|Tidak| H
    D --> E[Backend panggil AI Worker POST /highlights]
    E --> F[Baca match_events]
    F --> G{Ada event?}
    G -->|Tidak| H[Return kosong / skipped]
    G -->|Ya| I[Potong klip per event]
    I --> J[Gabung jadi reel]
    J --> K[Simpan file + insert highlights]
    K --> H[GET /api/highlights/id/download]
    H --> L[Download MP4]
```

---

## 10. Flowchart PDF Report

```mermaid
flowchart TD
    A[Buka Reports.jsx] --> B[GET /api/matches/id/report]
    B --> C[ReportController]
    C --> D[Kumpulkan data: events, stats, tactics]
    D --> E[Render template HTML]
    E --> F[DomPDF generate PDF]
    F --> G[Return PDF blob]
    G --> H[Browser download / preview]
```

---

## 11. Flowchart State Machine Tracking Status

```mermaid
stateDiagram-v2
    [*] --> none
    none --> queued : klik Start AI Analysis
    queued --> processing : worker mulai
    processing --> tagging : tracking selesai
    tagging --> done : auto-tag & highlight selesai
    queued --> failed : error
    processing --> failed : error
    tagging --> failed : error
    done --> [*]
    failed --> [*]
```

---

## 12. Legenda Simbol

| Simbol | Arti |
|---|---|
| `[ ]` / persegi | Proses / langkah |
| `{ }` / diamond | Keputusan (branching) |
| `[( )]` / cylinder | Database / storage |
| `-->` | Alur normal |
| `-->|label|` | Alur dengan keterangan |
