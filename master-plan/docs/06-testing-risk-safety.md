# 14. Testing Plan

## Manual Testing

| Module     | Scenario             |
| ----------- | --------------------- |
| Login      | Valid credentials    |
| Login      | Invalid credentials  |
| Team       | Create team           |
| Player     | Add player            |
| Match      | Create match          |
| Event      | Add goal event        |
| Statistics | Verify chart updates  |
| Video      | Upload MP4            |
| Tactical   | Save tactic           |
| PDF        | Download report       |

## 🆕 Automated Testing (Disarankan Ditambah)
Testing manual saja berisiko melewatkan bug tersembunyi di logika inti. Disarankan minimal ada unit test (PHPUnit) untuk:
- Auth (login gagal/berhasil, role check)
- Match CRUD (validasi input)
- Statistics calculation (memastikan angka statistik konsisten dengan data event yang diinput)

## Acceptance Criteria
- All CRUD operations work.
- Statistics update correctly.
- PDF downloads successfully.
- No critical console errors.

---

# 15. Risk Assessment

| Risk                    | Impact | Mitigation                  |
| ------------------------- | -------- | ------------------------------ |
| AI-generated buggy code | Medium | Build feature incrementally   |
| RAM usage too high       | Low    | Avoid Docker & heavy tools     |
| Video upload too large   | Medium | Limit file size to 500 MB      |
| Schedule delay           | Medium | Focus on MVP only              |
| Git conflict             | Low    | Commit frequently              |

---

# 16. Performance & Safety Plan

## Hardware Safety Rules
- Use 720p video.
- Avoid AI training.
- Use YOLOv8n only if needed.
- Keep room ventilation good.
- Monitor temperature with NitroSense.
- Stop heavy process if temperature > 85°C.

Expected development RAM usage: **4–7 GB**.
