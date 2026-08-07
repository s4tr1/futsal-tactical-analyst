# 🆕 API Endpoints (Draft)

> Belum ada di masterplan asli. Ini kontrak awal API antara Laravel (backend) dan React (frontend). Format response disarankan konsisten: `{ "success": bool, "data": {...}, "message": string }`.

## Auth
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| POST | `/api/register` | Public | Registrasi Coach (Player didaftarkan Coach, lihat REVIEW.md poin 3) |
| POST | `/api/login` | Public | Login, return token |
| POST | `/api/logout` | Coach, Player | Hapus token aktif |
| GET | `/api/me` | Coach, Player | Ambil data user login |

## Team
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| GET | `/api/teams` | Coach, Player | List team milik user |
| POST | `/api/teams` | Coach | Buat team baru |
| GET | `/api/teams/{id}` | Coach, Player | Detail team |
| PUT | `/api/teams/{id}` | Coach | Update team |
| DELETE | `/api/teams/{id}` | Coach | Hapus team |

## Player
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| GET | `/api/teams/{teamId}/players` | Coach, Player | List pemain di team |
| POST | `/api/teams/{teamId}/players` | Coach | Tambah pemain |
| PUT | `/api/players/{id}` | Coach | Update data pemain |
| DELETE | `/api/players/{id}` | Coach | Hapus pemain |

## Match
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| GET | `/api/teams/{teamId}/matches` | Coach, Player | List pertandingan |
| POST | `/api/teams/{teamId}/matches` | Coach | Buat pertandingan baru |
| GET | `/api/matches/{id}` | Coach, Player | Detail pertandingan |
| PUT | `/api/matches/{id}` | Coach | Update pertandingan (skor, status, dll) |
| DELETE | `/api/matches/{id}` | Coach | Hapus pertandingan |

## Match Event
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| GET | `/api/matches/{id}/events` | Coach, Player | List event pertandingan |
| POST | `/api/matches/{id}/events` | Coach | Tambah event baru (goal/shot/foul/turnover) |
| DELETE | `/api/events/{id}` | Coach | Hapus event (koreksi input salah) |

## Statistics
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| GET | `/api/matches/{id}/statistics` | Coach, Player | Statistik teragregasi (goal, shot accuracy, foul, dll) |

## Video
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| POST | `/api/matches/{id}/video` | Coach | Upload video (multipart/form-data) |
| GET | `/api/matches/{id}/video` | Coach, Player | Ambil metadata & URL streaming video |

## Tactical Board
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| GET | `/api/matches/{id}/tactics` | Coach, Player | List taktik tersimpan |
| POST | `/api/matches/{id}/tactics` | Coach | Simpan taktik baru (canvas_json) |
| GET | `/api/tactics/{id}` | Coach, Player | Load 1 taktik |
| DELETE | `/api/tactics/{id}` | Coach | Hapus taktik |

## Report
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| GET | `/api/matches/{id}/report` | Coach, Player | Generate & download PDF laporan |

## Catatan Keamanan
- Semua endpoint (kecuali `/register` dan `/login`) wajib pakai middleware `auth:sanctum`.
- Endpoint dengan role `Coach` wajib divalidasi lewat Laravel Policy — pastikan Coach hanya bisa mengelola team miliknya sendiri, bukan team coach lain.
- Endpoint upload video wajib validasi MIME type (`video/mp4`) dan ukuran maksimum di backend (bukan hanya frontend).
