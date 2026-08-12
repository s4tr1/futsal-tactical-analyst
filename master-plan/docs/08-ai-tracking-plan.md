/# 🆕 AI Object Tracking Plan — Futsal Tactical Analyst v2.0

> **Author:** Ismail  
> **Date:** August 2026  
> **Target Hardware:** RTX 3050 4GB VRAM  
> **Estimated Duration:** 2 minggu  

---

## 1. Objectives

- Deteksi otomatis posisi pemain dan bola dari video pertandingan futsal
- Tracking ID per pemain sepanjang pertandingan (pemain #1 tetap dikenal sebagai #1)
- Generate heatmap, movement trail, dan statistik ball possession otomatis
- Auto-generate match events (goal, shot, foul, turnover) dari data tracking
- Render overlay interaktif di atas video player React

---

## 2. Hardware Constraints & Strategy

| Parameter | Nilai | Strategi |
|-----------|-------|----------|
| GPU | RTX 3050 4GB VRAM | YOLOv8s (2.5 GB), batch_size=1 |
| Model inference | YOLOv8s | Kompromi akurasi vs VRAM, cukup untuk 10 pemain + bola |
| Tracking | ByteTrack | CPU-based, tidak pakai VRAM |
| Resolusi input | 640×640 | Cukup untuk lapangan futsal (40m × 20m) |
| Frame sampling | Setiap 5 frame (~6 FPS) | 10,800 data point per video 90 menit — manageable untuk MySQL |
| Proses video 90 menit | ~8-12 menit | Offline batch processing, bukan real-time |

### Yang tidak dilakukan (karena batasan hardware)

| Fitur | Alasan |
|-------|--------|
| YOLOv8l / YOLOv8x | VRAM tidak cukup — butuh 8GB+ |
| Training YOLOv8m full dari scratch | VRAM tidak cukup untuk batch training |
| Real-time inference (30 FPS) | Tidak diperlukan — futsal analyst bekerja offline |
| Batch size > 1 saat inference | 4GB hanya cukup untuk batch=1 |

---

## 3. Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│  React App  │────▶│  Laravel API  │────▶│   MySQL   │
│  (frontend)  │◀────│  (backend)   │◀────│           │
└─────────────┘     └──────┬───────┘     └───────────┘
                           │
                    POST /tracking/queue
                           │
                           ▼
                    ┌──────────────┐
                    │  AI Worker   │
                    │  (FastAPI)   │
                    │              │
                    │  YOLOv8s     │
                    │  ByteTrack   │
                    │  Post-proc   │
                    └──────┬───────┘
                           │
                    INSERT player_tracks
                    INSERT ball_tracks
                           │
                           ▼
                      ┌───────────┐
                      │   MySQL    │
                      └───────────┘
```

### Flow detail

```
1. Coach upload video → Laravel simpan ke storage/videos/
2. Coach klik "Start AI Analysis" → Laravel insert job ke queue
3. FastAPI worker polling queue setiap 5 detik
4. Worker ambil video → YOLOv8s inference per frame
5. ByteTrack assign tracking ID ke setiap pemain
6. Hasil koordinat disimpan ke player_tracks + ball_tracks
7. Post-processing: heatmap JSON, ball possession %, movement trails
8. Status video di-update ke "processed"
9. React fetch data tracking → render overlay di Canvas
```

---

## 4. Database Schema — Tabel Baru

### 4.1 `player_tracks`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | bigint, PK, auto-increment | |
| `match_id` | bigint, FK → matches.id, onDelete CASCADE | |
| `frame_number` | integer | Nomor frame (1, 6, 11, ... — sampling tiap 5 frame) |
| `tracking_id` | integer | ID konsisten dari ByteTrack (1, 2, 3, ...) |
| `x` | float | Koordinat X (0.0 - 1.0, normalized ke lebar lapangan) |
| `y` | float | Koordinat Y (0.0 - 1.0, normalized ke tinggi lapangan) |
| `confidence` | float | Confidence score deteksi (0.0 - 1.0) |
| `team` | enum('home', 'away', 'unknown') | Klasifikasi tim berdasarkan jersey/warna |
| `created_at` | timestamp | |

**Index:** `(match_id, frame_number)`, `(match_id, tracking_id)`

### 4.2 `ball_tracks`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | bigint, PK, auto-increment | |
| `match_id` | bigint, FK → matches.id, onDelete CASCADE | |
| `frame_number` | integer | |
| `x` | float | |
| `y` | float | |
| `confidence` | float | |
| `created_at` | timestamp | |

**Index:** `(match_id, frame_number)`

### 4.3 Migration examples

```php
// create_player_tracks_table.php
Schema::create('player_tracks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');
    $table->integer('frame_number');
    $table->integer('tracking_id');
    $table->float('x');
    $table->float('y');
    $table->float('confidence')->default(0);
    $table->enum('team', ['home', 'away', 'unknown'])->default('unknown');
    $table->timestamp('created_at')->useCurrent();
    $table->index(['match_id', 'frame_number']);
    $table->index(['match_id', 'tracking_id']);
});

// create_ball_tracks_table.php
Schema::create('ball_tracks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');
    $table->integer('frame_number');
    $table->float('x');
    $table->float('y');
    $table->float('confidence')->default(0);
    $table->timestamp('created_at')->useCurrent();
    $table->index(['match_id', 'frame_number']);
});
```

### 4.4 Tambahan kolom di tabel `videos`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `tracking_status` | enum('none','queued','processing','done','failed') | Default: 'none' |
| `tracking_error` | text, nullable | Error message jika gagal |
| `tracking_started_at` | timestamp, nullable | |
| `tracking_finished_at` | timestamp, nullable | |
| `total_frames_processed` | integer, default 0 | |
| `fps_source` | float, nullable | FPS video asli |

---

## 5. API Endpoints Baru

### 5.1 Trigger Inference

```
POST /api/matches/{matchId}/tracking/queue
Auth: Bearer token
Response: { success: true, data: { status: "queued" }, message: "Tracking queued." }
```

### 5.2 Cek Status

```
GET /api/matches/{matchId}/tracking/status
Auth: Bearer token
Response: {
  success: true,
  data: {
    status: "done",                      // none | queued | processing | done | failed
    progress: 100,                       // percentage
    total_frames_processed: 10800,
    started_at: "2026-08-10T14:30:00Z",
    finished_at: "2026-08-10T14:38:00Z"
  }
}
```

### 5.3 Data Posisi Pemain

```
GET /api/matches/{matchId}/tracking/players?tracking_id=1&start_frame=0&end_frame=10800
Auth: Bearer token
Response: {
  success: true,
  data: [
    { frame_number: 1, tracking_id: 1, x: 0.45, y: 0.32, confidence: 0.94, team: "home" },
    { frame_number: 6, tracking_id: 1, x: 0.47, y: 0.35, confidence: 0.91, team: "home" },
    ...
  ]
}
```

### 5.4 Data Posisi Bola

```
GET /api/matches/{matchId}/tracking/ball?start_frame=0&end_frame=10800
```

### 5.5 Heatmap JSON

```
GET /api/matches/{matchId}/tracking/heatmap?type=players         // players | ball
Auth: Bearer token
Response: {
  success: true,
  data: {
    grid_size: { cols: 20, rows: 10 },
    cells: [[0.5, 0.8, 0.3, ...], [...], ...]   // normalized density per cell
  }
}
```

### 5.6 Statistik AI

```
GET /api/matches/{matchId}/tracking/summary
Auth: Bearer token
Response: {
  success: true,
  data: {
    ball_possession: { home: 52.3, away: 47.7 },
    distance_covered: { home: 12450, away: 11980 },   // meters per team
    avg_player_speed: { home: 2.1, away: 1.9 },       // m/s
    heatmap_hotspot: { x: 0.48, y: 0.50 },            // area paling sering
    dominant_zone: "center"
  }
}
```

### 5.7 Auto-Tag Events

```
POST /api/matches/{matchId}/tracking/auto-tag
Auth: Bearer token
Response: {
  success: true,
  data: { events_generated: 42 },
  message: "42 events auto-generated from tracking data."
}
```

Logic auto-tag:
- **Goal**: bola mendekati koordinat gawang ± confidence tinggi → `event_type: goal`
- **Shot**: trajectory bola cepat mendekati gawang → `event_type: shot`
- **Turnover**: possession switch dalam < 2 detik → `event_type: turnover`
- **Foul**: pemain berhenti mendadak + bola diam → `event_type: foul` (low confidence, manual review)

---

## 6. Frontend — React Overlay

### 6.1 Arsitektur komponen

```
LiveTagging.jsx
├── <video> (existing)
├── <Canvas overlay> (BARU — posisi absolut di atas video)
│   ├── Heatmap (colored density map)
│   ├── Player tokens (tracking ID + posisi)
│   └── Movement trails (garis 5 detik terakhir)
├── Toolbar toggle
│   ├── [✓] Show Heatmap
│   ├── [✓] Show Players
│   ├── [✓] Show Ball Trail
│   └── [Generate Events] → POST auto-tag
└── Event stream (existing)
```

### 6.2 Canvas rendering

- Sinkronisasi dengan `video.currentTime` → fetch frame data via API
- Player tokens: lingkaran dengan tracking ID di atas koordinat lapangan
- Heatmap: overlay semi-transparan, makin merah = makin sering pemain di area itu
- Movement trail: polyline 5 detik terakhir untuk setiap pemain

### 6.3 State management

```javascript
const [trackingStatus, setTrackingStatus] = useState(null);
const [playerTracks, setPlayerTracks] = useState([]);
const [ballTracks, setBallTracks] = useState([]);
const [heatmapData, setHeatmapData] = useState(null);
const [aiSummary, setAiSummary] = useState(null);
const [overlays, setOverlays] = useState({
  heatmap: true,
  players: true,
  ballTrail: true
});
```

---

## 7. AI Worker — Python FastAPI

### 7.1 `ai-worker/` folder structure

```
ai-worker/
├── main.py              # FastAPI entry, endpoint POST /process, GET /health
├── detector.py          # YOLOv8s inference class
├── tracker.py           # ByteTrack wrapper class
├── postprocess.py       # heatmap, ball possession, movement trail
├── auto_tagger.py       # rule-based event auto-generation
├── db.py                # MySQL connection (PyMySQL)
├── config.py            # DB credentials, model path, frame sampling rate
├── requirements.txt     # ultralytics, fastapi, pymysql, opencv-python, numpy
├── models/
│   └── yolov8s.pt       # pre-trained model (download via Ultralytics)
└── test_video.mp4       # sample video untuk testing
```

### 7.2 `detector.py` — YOLOv8s inference

```python
from ultralytics import YOLO
import cv2
import numpy as np

class Detector:
    def __init__(self, model_path="models/yolov8s.pt"):
        self.model = YOLO(model_path)
        
    def detect(self, frame: np.ndarray):
        """
        Returns: [
          { class: 'player', bbox: [x1,y1,x2,y2], confidence: 0.94 },
          { class: 'ball', bbox: [x1,y1,x2,y2], confidence: 0.82 },
          ...
        ]
        """
        results = self.model(frame, verbose=False, device=0)  # device=0 = GPU
        detections = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                cls_name = self.model.names[cls_id]
                if cls_name in ['person', 'sports ball']:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    detections.append({
                        'class': 'player' if cls_name == 'person' else 'ball',
                        'bbox': [x1, y1, x2, y2],
                        'confidence': float(box.conf[0]),
                        'center': [(x1+x2)/2, (y1+y2)/2]
                    })
        return detections
```

### 7.3 `tracker.py` — ByteTrack

```python
import numpy as np

class PlayerTracker:
    def __init__(self):
        # Simple ByteTrack-style tracking via IoU matching
        self.next_id = 1
        self.active_tracks = {}  # { tracking_id: { bbox, age, ... } }
        
    def update(self, detections, frame_number):
        """
        Assign tracking_id ke setiap player detection.
        Returns: [{ tracking_id, bbox, center, confidence }, ...]
        """
        # IoU matching logic antara detections baru dan active_tracks
        # New detection → match existing OR create new tracking_id
        # Lost tracks → keep for 30 frames before removing
        pass
```

### 7.4 `postprocess.py` — Heatmap & statistics

```python
import numpy as np

def generate_heatmap(player_tracks, grid_cols=20, grid_rows=10):
    """Generate normalized heatmap grid dari data posisi pemain"""
    grid = np.zeros((grid_rows, grid_cols))
    for track in player_tracks:
        col = int(track['x'] * grid_cols)
        row = int(track['y'] * grid_rows)
        if 0 <= col < grid_cols and 0 <= row < grid_rows:
            grid[row][col] += 1
    return (grid / grid.max()).tolist() if grid.max() > 0 else grid.tolist()

def calculate_possession(ball_tracks, player_tracks):
    """Estimasi ball possession: pemain terdekat ke bola dianggap punya possession"""
    home_possession = 0
    total = 0
    for frame in ball_tracks:
        nearest = find_nearest_player(frame, player_tracks)
        if nearest and nearest['team'] == 'home':
            home_possession += 1
        total += 1
    return {
        'home': round(home_possession / total * 100, 1) if total > 0 else 50,
        'away': round(100 - home_possession / total * 100, 1) if total > 0 else 50
    }
```

### 7.5 `main.py` — FastAPI worker

```python
from fastapi import FastAPI
from detector import Detector
from tracker import PlayerTracker
from postprocess import generate_heatmap, calculate_possession
from db import DB
import cv2

app = FastAPI()
detector = Detector()
tracker = PlayerTracker()
db = DB()

@app.post("/process")
async def process_video(data: dict):
    match_id = data['match_id']
    video_path = data['video_path']
    
    db.update_video_status(match_id, 'processing')
    
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_number = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Sample setiap 5 frame
        if frame_number % 5 == 0:
            detections = detector.detect(frame)
            players = [d for d in detections if d['class'] == 'player']
            balls = [d for d in detections if d['class'] == 'ball']
            
            tracked = tracker.update(players, frame_number)
            
            for t in tracked:
                db.insert_player_track(match_id, frame_number, t['tracking_id'],
                                       t['center'][0], t['center'][1], t['confidence'])
            for b in balls:
                db.insert_ball_track(match_id, frame_number,
                                     b['center'][0], b['center'][1], b['confidence'])
        
        frame_number += 1
    
    cap.release()
    
    # Post-processing
    all_tracks = db.get_player_tracks(match_id)
    heatmap = generate_heatmap(all_tracks)
    db.save_heatmap(match_id, heatmap)
    
    db.update_video_status(match_id, 'done', frame_number)
    
    return {"status": "done", "frames_processed": frame_number}

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": detector.model is not None}
```

### 7.6 `requirements.txt`

```
ultralytics==8.3.0
fastapi==0.115.0
uvicorn==0.30.0
opencv-python==4.10.0
numpy==2.1.0
pymysql==1.1.1
python-multipart==0.0.12
```

### 7.7 Menjalankan worker

```bash
cd ai-worker/
pip install -r requirements.txt
python -c "from ultralytics import YOLO; YOLO('yolov8s.pt')"  # download model
uvicorn main:app --host 127.0.0.1 --port 8001
```

---

## 8. Laravel — Queue & Controller Baru

### 8.1 `TrackingController.php`

```php
class TrackingController extends Controller
{
    public function queue(Request $request, $matchId)
    {
        $match = Matches::findOrFail($matchId);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        
        $video = $match->video;
        if (!$video) {
            return response()->json(['success' => false, 'message' => 'Upload video terlebih dahulu.'], 400);
        }
        
        $video->update(['tracking_status' => 'queued', 'tracking_started_at' => now()]);
        
        // Trigger AI worker via HTTP
        Http::post('http://127.0.0.1:8001/process', [
            'match_id' => $matchId,
            'video_path' => Storage::disk('public')->path($video->file_path),
        ]);
        
        return response()->json(['success' => true, 'data' => ['status' => 'queued']]);
    }
    
    public function status(Request $request, $matchId)
    {
        $video = Matches::findOrFail($matchId)->video;
        return response()->json([
            'success' => true,
            'data' => [
                'status' => $video->tracking_status ?? 'none',
                'total_frames_processed' => $video->total_frames_processed ?? 0,
            ]
        ]);
    }
}
```

### 8.2 Routes

```php
// routes/api.php (dalam group auth:sanctum)
Route::post('matches/{matchId}/tracking/queue', [TrackingController::class, 'queue']);
Route::get('matches/{matchId}/tracking/status', [TrackingController::class, 'status']);
Route::get('matches/{matchId}/tracking/players', [TrackingController::class, 'players']);
Route::get('matches/{matchId}/tracking/ball', [TrackingController::class, 'ball']);
Route::get('matches/{matchId}/tracking/heatmap', [TrackingController::class, 'heatmap']);
Route::get('matches/{matchId}/tracking/summary', [TrackingController::class, 'summary']);
Route::post('matches/{matchId}/tracking/auto-tag', [TrackingController::class, 'autoTag']);
```

---

## 9. Timeline

### Minggu 1 — Setup & Core Detection

| Hari | Task | Output |
|------|------|--------|
| 1 | Install Python 3.10 + CUDA toolkit + cuDNN | Environment siap |
| 2 | `pip install` dependencies, download YOLOv8s.pt | Model terdownload |
| 3-4 | Test inference 1 frame: deteksi pemain + bola | `detector.py` berfungsi |
| 5 | Buat migration `player_tracks` + `ball_tracks` + alter `videos` | Tabel siap |
| 6-7 | Buat `main.py` + `db.py`: pipeline lengkap (baca video → deteksi → simpan DB) | Pipeline MVP berjalan |

### Minggu 2 — Tracking + Frontend + Polish

| Hari | Task | Output |
|------|------|--------|
| 8-9 | ByteTrack: implementasi `tracker.py` + test | Tracking ID konsisten |
| 10 | `postprocess.py`: heatmap, possession, trail | Statistik AI siap |
| 11-12 | Laravel API + React Canvas overlay | Overlay tampil di UI |
| 13 | `auto-tag` logic + test full pipeline | Events auto-generated |
| 14 | Polish UI, dokumentasi, record demo video | Siap showcase |

---

## 10. Testing Plan

### 10.1 Unit Tests (Python)

| Test | File | Deskripsi |
|------|------|-----------|
| `test_detector.py` | `ai-worker/tests/` | Deteksi frame statis: pastikan return bbox valid |
| `test_tracker.py` | `ai-worker/tests/` | 10 frame berurutan: tracking ID harus konsisten |
| `test_postprocess.py` | `ai-worker/tests/` | Heatmap dim 20×10, possession sum = 100% |

### 10.2 Integration Tests (Laravel)

| Test | Deskripsi |
|------|-----------|
| `TrackingTest::test_queue_requires_video` | Queue gagal jika belum upload video |
| `TrackingTest::test_unauthorized_access` | User tidak bisa akses tracking match tim lain |
| `TrackingTest::test_status_endpoint` | Status endpoint return data valid |

### 10.3 Sample Video Testing

- Video futsal 2 menit (720p, 30 FPS)
- Verifikasi: tracking ID pemain terdeteksi, bola terdeteksi > 70% frame
- Verifikasi: heatmap render di React overlay tanpa lag

---

## 11. Risk Assessment

| Risiko | Probability | Impact | Mitigation |
|--------|------------|--------|------------|
| Bola terlalu kecil untuk dideteksi | Medium | High | Fine-tune YOLOv8s dengan 100-200 frame futsal annotated |
| Tracking ID swap antar pemain | Medium | Medium | ByteTrack IoU threshold tuning + re-identification heuristics |
| VRAM overflow saat video panjang | Low | High | Process per batch 500 frame, release GPU memory |
| FastAPI worker crash | Low | Medium | Retry logic + error log ke `videos.tracking_error` |
| Heatmap terlalu sparse (sampling 5 frame) | Low | Low | Interpolasi linear antar data point |

---

## 12. Success Criteria

Tracking AI v2.0 dianggap berhasil apabila:

- [ ] Pipeline inference berjalan dari video MP4 720p tanpa error
- [ ] Pemain terdeteksi dengan confidence > 0.7 pada > 80% frame
- [ ] Tracking ID pemain konsisten sepanjang pertandingan
- [ ] Bola terdeteksi pada > 60% frame
- [ ] Heatmap dan movement trail dapat dirender di React overlay
- [ ] Auto-tag menghasilkan minimal events untuk goal dan shot
- [ ] Statistik ball possession dan distance covered terhitung akurat
- [ ] Demo video menampilkan semua fitur dalam 2-3 menit

---

## 13. Folder Structure Final

```text
futsal-tactical-analyst/
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/TrackingController.php    (BARU)
│   │   └── Models/
│   │       ├── PlayerTrack.php                         (BARU)
│   │       └── BallTrack.php                           (BARU)
│   ├── database/migrations/
│   │   ├── 2026_08_xx_create_player_tracks_table.php   (BARU)
│   │   ├── 2026_08_xx_create_ball_tracks_table.php     (BARU)
│   │   └── 2026_08_xx_add_tracking_status_to_videos.php (BARU)
│   └── routes/api.php                                  (update)
├── frontend/
│   └── src/
│       └── pages/LiveTagging.jsx                       (update)
├── ai-worker/                                           (BARU)
│   ├── main.py
│   ├── detector.py
│   ├── tracker.py
│   ├── postprocess.py
│   ├── auto_tagger.py
│   ├── db.py
│   ├── config.py
│   ├── requirements.txt
│   ├── models/
│   │   └── yolov8s.pt
│   └── tests/
│       ├── test_detector.py
│       ├── test_tracker.py
│       └── test_postprocess.py
└── master-plan/
    └── docs/
        └── 08-ai-tracking-plan.md                       (FILE INI)
```

---

## 14. References

- [Ultralytics YOLOv8 Documentation](https://docs.ultralytics.com/)
- [ByteTrack: Multi-Object Tracking by Associating Every Detection Box](https://arxiv.org/abs/2110.06864)
- [YOLOv8 Model Comparison](https://docs.ultralytics.com/models/yolov8/#performance-metrics)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
