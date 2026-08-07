# 5. Functional Requirements

## Authentication
- Register
- Login
- Logout
- Role-based access

## Team Module
- Create team
- Edit team
- Delete team
- View team details

## Player Module
- Add player
- Edit player
- Remove player
- Assign jersey number

## Match Module
- Create match
- Edit match
- Record score
- Record location & date
- 🆕 Record match status (`scheduled` / `live` / `finished`)

## Event Module
- Goal
- Shot
- Foul
- Turnover
- Minute & second timestamp
- 🆕 Half (1st / 2nd) — durasi standar futsal 2×20 menit

## Statistics Module
- Total goals
- Total shots
- Shot accuracy
- Total fouls
- Total turnovers
- Simple possession estimation ⚠️ *(lihat REVIEW.md poin 5 — perlu didefinisikan ulang metodenya)*

## Tactical Board
- Drag player markers
- Draw arrows
- Save tactic
- Load tactic

## Video Module
- Upload MP4
- Store metadata
- HTML5 playback

## Report Module
- Generate PDF
- Include statistics
- Include event timeline
- Include tactical snapshot

---

# 6. Non-Functional Requirements

| Requirement     | Target                            |
| --------------- | ---------------------------------- |
| Load time       | < 3 seconds                        |
| Responsive      | Mobile & desktop                   |
| Database        | MySQL                              |
| Max upload      | 500 MB                             |
| Browser support | Chrome, Edge, Firefox              |
| Security        | CSRF, validation, hashed password  |
| RAM usage       | < 8 GB during development          |

### 🆕 Tambahan yang disarankan
| Requirement | Target |
|---|---|
| Rate limiting | Maks. 5 percobaan login/menit per IP |
| Authorization | Laravel Policy per role (Coach vs Player) |
| File validation | Validasi MIME type & ukuran di backend, bukan hanya frontend |
| API response format | Konsisten (mis. `{ success, data, message }`) di semua endpoint |
