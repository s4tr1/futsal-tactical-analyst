# 🆕 Database Schema (Draft Detail)

> File ini adalah usulan detail untuk menutup gap di masterplan asli, yang sebelumnya hanya menyebut nama tabel & relasi tingkat tinggi. Sesuaikan lagi sesuai kebutuhan saat implementasi migration.

## `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint, PK | |
| name | varchar(100) | |
| email | varchar(150), unique | |
| password | varchar(255) | hashed |
| role | enum('coach','player') | |
| team_id | bigint, FK → teams.id, nullable | player terhubung ke 1 team |
| created_at / updated_at | timestamp | |

## `teams`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint, PK | |
| name | varchar(100) | |
| logo_path | varchar(255), nullable | |
| coach_id | bigint, FK → users.id | pemilik/pembuat team |
| created_at / updated_at | timestamp | |

## `players`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint, PK | |
| team_id | bigint, FK → teams.id | |
| user_id | bigint, FK → users.id, nullable | jika player punya akun login |
| name | varchar(100) | |
| jersey_number | integer | |
| position | varchar(50), nullable | mis. Pivot, Anchor, Flank |
| photo_path | varchar(255), nullable | |
| created_at / updated_at | timestamp | |

## `matches`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint, PK | |
| team_id | bigint, FK → teams.id | |
| opponent_name | varchar(100) | |
| match_date | date | |
| location | varchar(150), nullable | |
| competition | varchar(100), nullable | |
| status | enum('scheduled','live','finished') | 🆕 |
| score_team | integer, default 0 | |
| score_opponent | integer, default 0 | |
| created_at / updated_at | timestamp | |

## `match_events`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint, PK | |
| match_id | bigint, FK → matches.id | |
| player_id | bigint, FK → players.id, nullable | nullable untuk event tim lawan |
| event_type | enum('goal','shot','foul','turnover') | |
| half | tinyint (1 atau 2) | 🆕 babak futsal |
| minute | integer | |
| second | integer | |
| notes | varchar(255), nullable | |
| created_at | timestamp | |

## `videos`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint, PK | |
| match_id | bigint, FK → matches.id | |
| file_path | varchar(255) | |
| duration_seconds | integer, nullable | |
| uploaded_at | timestamp | |

## `tactics`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint, PK | |
| match_id | bigint, FK → matches.id | |
| name | varchar(100) | |
| canvas_json | json | posisi token, panah, anotasi |
| created_by | bigint, FK → users.id | |
| created_at / updated_at | timestamp | |

## Diagram Relasi (Ringkas)
```text
users (coach) 1---* teams
teams 1---* players
teams 1---* matches
matches 1---* match_events
matches 1---1 videos
matches 1---* tactics
players 1---* match_events (nullable)
```

## Catatan
- Semua foreign key sebaiknya pakai `onDelete('cascade')` untuk `match_events`, `videos`, `tactics` agar konsisten saat sebuah match dihapus.
- Index tambahan disarankan pada `match_events.match_id` dan `match_events.event_type` karena akan sering di-query untuk perhitungan statistik.
