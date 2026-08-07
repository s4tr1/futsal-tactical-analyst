# 7. System Architecture

```text
React + Vite
      |
      | HTTP/JSON
      v
Laravel 12 API
      |
      +---- MySQL
      |
      +---- Storage (video, pdf)
```

Optional future module:

```text
Laravel API
      |
      +---- Python YOLOv8n (Inference only)
```

No training process is included.

---

# 8. Database Design (Ringkasan)

## Tables
- users
- teams
- players
- matches
- match_events
- videos
- tactics

## Relationships
- User 1..* Team
- Team 1..* Player
- Team 1..* Match
- Match 1..* MatchEvent
- Match 1..1 Video
- Match 1..* Tactic

> 📄 Skema detail (kolom, tipe data, foreign key) ada di `03-database-schema.md`.

---

# 9. Technology Stack

| Layer            | Technology               |
| ----------------- | ------------------------- |
| Frontend          | React 19 + Vite           |
| Styling           | Tailwind CSS               |
| Charts            | Chart.js                   |
| Backend           | Laravel 12                 |
| Auth              | Laravel Breeze API         |
| Database          | MySQL                       |
| PDF               | barryvdh/laravel-dompdf     |
| Version Control   | Git + GitHub                 |
| Development       | XAMPP / Laragon              |
| Editor            | VS Code                       |

### 🆕 Belum ditentukan (perlu diputuskan sebelum Week 3)
| Kebutuhan | Opsi yang disarankan |
|---|---|
| Tactical board canvas | `react-konva` |
| State management React | Context API (cukup untuk skala MVP) / Zustand jika ingin lebih ringan dari Redux |
| PHP version minimum | Laravel 12 butuh PHP ^8.2 |

---

# 10. Folder Structure

```text
futsal-tactical-analyst/
├── backend/
│   ├── app/
│   ├── database/
│   ├── routes/
│   └── storage/
├── frontend/
│   ├── src/
│   ├── public/
│   └── components/
├── docs/
├── assets/
├── screenshots/
└── README.md
```
