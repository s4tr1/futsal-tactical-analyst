# Proposal Skripsi — Analisis Taktik Futsal Berbasis Computer Vision dan Data Science

> **Dokumen untuk:** Dosen Pembimbing Skripsi
> **Bidang Minat:** Data Science
> **Topik:** Deteksi dan Pelacakan Objek (Object Detection & Tracking) untuk Analisis Taktik Pertandingan Futsal
> **Sistem:** FUTSIGHT — Futsal Tactical Analyst

---

## 1. Identitas Penelitian

| Komponen | Keterangan |
|---|---|
| **Judul Usulan** | Implementasi YOLOv8 dan ByteTrack untuk Deteksi, Pelacakan, dan Analisis Statistik Pertandingan Futsal Berbasis Web |
| **Bidang Minat** | Data Science / Computer Vision |
| **Jenis Penelitian** | Applied Research / Experimental (System Development) |
| **Lingkup** | Website full-stack (Laravel + React + Python FastAPI) |
| **Target Luaran** | Aplikasi web analisis taktik futsal + skripsi + publikasi/portofolio |

---

## 2. Latar Belakang

Analisis performa dalam olahraga (sports analytics) telah menjadi salah satu penerapan *data science* yang paling berkembang pesat. Pada cabang futsal, pelatih dan analis masih sangat bergantung pada pengamatan manual yang subjektif, memakan waktu, dan sulit direproduksi. Informasi penting seperti posisi pemain, penguasaan bola (*ball possession*), jarak tempuh (*distance covered*), dan momen krusial (gol, tembakan, pelanggaran) umumnya dicatat secara manual sehingga rentan bias dan tidak terukur secara kuantitatif.

Perkembangan *computer vision*, khususnya algoritma deteksi objek berbasis *deep learning* (YOLO) dan pelacakan multi-objek (ByteTrack), membuka peluang untuk mengekstraksi data posisi pemain dan bola secara otomatis dari rekaman video. Data spasial-temporal yang dihasilkan kemudian dapat diolah dengan metode *data science* (agregasi statistik, heatmap, perhitungan possession, dan *rule-based event detection*) menjadi insight yang objektif bagi pelatih.

Penelitian ini bertujuan membangun platform **FUTSIGHT** yang mengintegrasikan pipeline *computer vision* dan *data science* untuk menganalisis taktik pertandingan futsal secara otomatis, mulai dari deteksi pemain/bola, pelacakan lintasan, hingga visualisasi statistik dan pelaporan.

---

## 3. Rumusan Masalah

1. Bagaimana mendeteksi pemain dan bola pada video pertandingan futsal menggunakan YOLOv8?
2. Bagaimana mempertahankan identitas (tracking ID) setiap pemain sepanjang pertandingan menggunakan ByteTrack?
3. Bagaimana mengubah data pelacakan (koordinat per frame) menjadi informasi taktik yang bermakna, seperti *ball possession*, *distance covered*, heatmap, dan deteksi event (gol)?
4. Bagaimana mengintegrasikan seluruh pipeline ke dalam satu aplikasi web yang dapat digunakan oleh pelatih?

---

## 4. Tujuan Penelitian

1. Mengimplementasikan model YOLOv8s untuk deteksi objek pemain dan bola pada video futsal.
2. Mengimplementasikan ByteTrack untuk pelacakan multi-objek yang menghasilkan tracking ID konsisten.
3. Mengembangkan modul post-processing berbasis *rule* untuk menghasilkan statistik pertandingan (possession, jarak tempuh, heatmap) dan deteksi event otomatis.
4. Membangun dan mengintegrasikan aplikasi web (React + Laravel + FastAPI) sebagai antarmuka visualisasi hasil analisis.

---

## 5. Manfaat Penelitian

| Pihak | Manfaat |
|---|---|
| **Pelatih & Analis** | Analisis taktik objektif, hemat waktu, berbasis data kuantitatif |
| **Peneliti / Akademisi** | Referensi penerapan object detection & tracking pada olahraga indoor skala kecil |
| **Pengembang** | Arsitektur referensi integrasi deep learning inference ke aplikasi web |

---

## 6. Batasan Masalah

- Objek yang dideteksi terbatas pada kelas `person` (pemain) dan `sports ball` (bola).
- Model menggunakan **YOLOv8s pre-trained**; tidak dilakukan *fine-tuning* besar karena keterbatasan GPU (RTX 3050 4GB VRAM).
- Inferensi bersifat **offline/batch**, bukan real-time (30 FPS).
- Sampling frame dilakukan setiap 5 frame (±6 FPS) untuk menghemat komputasi dan storage.
- Klasifikasi tim (`home`/`away`) menggunakan heuristik warna, saat ini default `unknown` dan menjadi peluang pengembangan lanjutan.
- Auto-deteksi event difokuskan pada **goal** (rule-based); event lain (shot, foul, turnover) ditangani manual lewat live tagging.

---

## 7. Tinjauan Pustaka

### 7.1 Object Detection — YOLO
YOLO (*You Only Look Once*) adalah keluarga algoritma deteksi objek yang memproses seluruh gambar dalam satu *forward pass*, sehingga cepat dan cocok untuk aplikasi video. YOLOv8 (Ultralytics) menyediakan varian model `n/s/m/l/x` dengan pertukaran akurasi–kecepatan. Penelitian ini memilih **YOLOv8s** sebagai kompromi antara akurasi dan keterbatasan VRAM 4GB.

### 7.2 Multi-Object Tracking — ByteTrack
ByteTrack adalah algoritma pelacakan multi-objek yang mengasosiasikan setiap kotak deteksi antar frame dengan pendekatan IoU (*Intersection over Union*) dua tahap (deteksi *high-confidence* dan *low-confidence*), sehingga mampu mempertahankan identitas objek tanpa biaya komputasi besar. ByteTrack dipilih karena berbasis CPU dan tidak menambah beban VRAM.

### 7.3 Sports Analytics & Data Science
Analisis olahraga memanfaatkan data posisi untuk menghitung metrik seperti:
- **Ball possession** — persentase waktu sebuah tim menguasai bola.
- **Distance covered** — akumulasi jarak tempuh pemain.
- **Heatmap** — distribusi spasial keberadaan pemain/bola.
- **Event detection** — identifikasi momen kunci dari pola data (misal bola memasuki zona gawang).

### 7.4 Metodologi Data Science — CRISP-DM
Penelitian ini mengikuti kerangka CRISP-DM (*Cross-Industry Standard Process for Data Mining*) yang terdiri atas enam fase: *Business Understanding*, *Data Understanding*, *Data Preparation*, *Modeling*, *Evaluation*, dan *Deployment*.

---

## 8. Metodologi Penelitian

Penelitian menggunakan pendekatan eksperimental dengan alur CRISP-DM.

### 8.1 Business Understanding
Memahami kebutuhan pelatih futsal terhadap analisis taktik berbasis data: penguasaan bola, jarak tempuh, area dominasi (heatmap), dan momen krusial pertandingan.

### 8.2 Data Understanding
Data primer berupa **video rekaman pertandingan futsal** (720p). Karakteristik data:
- Resolusi input model: 640×640.
- Satu pertandingan 90 menit menghasilkan ±10.800 titik data (sampling 5 frame @ 30 FPS).
- Kelas target: `player` dan `ball`.

### 8.3 Data Preparation
- Ekstraksi frame dari video (OpenCV).
- Down-sampling frame (interval 5).
- Normalisasi koordinat deteksi ke rentang `0.0 – 1.0` relatif terhadap dimensi lapangan.
- Penyimpanan data pelacakan ke MySQL (tabel `player_tracks`, `ball_tracks`).

### 8.4 Modeling
Tiga tahap utama:
1. **Deteksi** — YOLOv8s memproses tiap frame, menghasilkan bounding box, kelas, dan confidence.
2. **Tracking** — ByteTrack mengasosiasikan deteksi antar frame untuk menghasilkan `tracking_id` konsisten.
3. **Post-processing & Event Detection** — perhitungan possession (pemain terdekat bola), distance covered (jarak Euclidean antar posisi berurutan), heatmap (grid 20×10), dan deteksi goal (bola memasuki zona gawang `y ≤ 0.35` atau `y ≥ 0.65` dengan confidence > 0.5).

### 8.5 Evaluation
Evaluasi dilakukan pada dua level:
- **Level model (CV):** precision, recall, mAP (deteksi); MOTA/IDF1 (tracking).
- **Level produk:** kriteria sukses (confidence deteksi > 0.7 pada > 80% frame, tracking ID konsisten, bola terdeteksi > 60% frame, hasil statistik valid).

### 8.6 Deployment
Seluruh pipeline diintegrasikan ke aplikasi web tiga lapis (Frontend React, Backend Laravel, AI Worker FastAPI) dan diuji end-to-end.

---

## 9. Arsitektur Sistem

```
React 19 (Frontend :5173)
        │ HTTP/JSON (Bearer Token)
        ▼
Laravel 13 (Backend :8000) ──────► MySQL 8 + Storage
        │  TriggerAiTracking (Queue Job)
        ▼
FastAPI (AI Worker :8001)
        ├── YOLOv8s (detection)
        ├── ByteTrack (tracking)
        ├── auto_tagger (event detection)
        └── clipper (highlight)
```

---

## 10. Data & Skema Penyimpanan

| Tabel | Isi | Kolom Penting |
|---|---|---|
| `matches` | Data pertandingan | skor, status |
| `videos` | Video + status tracking | `tracking_status`, `fps_source`, `total_frames_processed` |
| `player_tracks` | Posisi pemain per frame | `frame_number`, `tracking_id`, `x`, `y`, `confidence`, `team` |
| `ball_tracks` | Posisi bola per frame | `frame_number`, `x`, `y`, `confidence` |
| `match_events` | Event pertandingan | `event_type`, `minute`, `second` |
| `highlights` | Klip video highlight | path klip/reel |

---

## 11. Metrik Evaluasi (Data Science)

| Metrik | Formula/Konsep | Target |
|---|---|---|
| **Precision** | TP / (TP + FP) | Tinggi (meminimalkan false positive deteksi) |
| **Recall** | TP / (TP + FN) | Tinggi (meminimalkan pemain terlewat) |
| **mAP@0.5** | Rata-rata Average Precision (IoU 0.5) | Standar benchmark YOLO |
| **MOTA** | Akurasi pelacakan multi-objek (FP, FN, ID-switch) | Tracking ID stabil |
| **IDF1** | Rasio korespondensi identitas | Meminimalkan ID-switch |
| **Confidence** | Skor keyakinan deteksi | > 0.7 |

---

## 12. Jadwal Penelitian (Estimasi)

| Tahap | Durasi | Kegiatan |
|---|---|---|
| Studi Literatur | 1–2 minggu | Kajian YOLO, ByteTrack, sports analytics |
| Persiapan Data | 1 minggu | Kumpulkan sampel video futsal, konfigurasi dataset |
| Implementasi Deteksi | 1–2 minggu | Setup YOLOv8s, inferensi frame |
| Implementasi Tracking | 1 minggu | ByteTrack, konsistensi tracking ID |
| Post-processing & Analisis | 1–2 minggu | Possession, heatmap, distance, event detection |
| Integrasi Web | 2 minggu | Backend Laravel + Frontend React + API worker |
| Evaluasi & Pengujian | 1–2 minggu | Uji metrik, perbaikan, dokumentasi |
| Penyusunan Laporan | 2 minggu | Penulisan skripsi + demo |

---

## 13. Luaran (Deliverables)

1. Aplikasi web **FUTSIGHT** (frontend, backend, AI worker) yang berjalan end-to-end.
2. Dokumentasi teknis (arsitektur, API, skema database, alur sistem).
3. Laporan skripsi.
4. (Opsional) Artikel/paper ringkas untuk publikasi.

---

## 14. Daftar Pustaka

1. J. Redmon, S. Divvala, R. Girshick, A. Farhadi, *"You Only Look Once: Unified, Real-Time Object Detection,"* IEEE CVPR, 2016.
2. G. Jocher, A. Chaurasia, J. Qiu, *"Ultralytics YOLOv8,"* 2023. https://docs.ultralytics.com/
3. Y. Zhang, P. Sun, Y. Jiang, D. Yu, F. Weng, Z. Yuan, P. Luo, W. Liu, X. Wang, *"ByteTrack: Multi-Object Tracking by Associating Every Detection Box,"* arXiv:2110.06864, 2021.
4. R. Padilla, S. L. Netto, E. A. B. da Silva, *"A Survey on Performance Metrics for Object-Detection Algorithms,"* IEEE IWSSIP, 2020.
5. P. Wirth, R. Hipp, *"CRISP-DM: Towards a Standard Process Model for Data Mining,"* Proceedings of the 4th International Conference on the Practical Application of Knowledge Discovery and Data Mining, 2000.
6. K. Bernardini, *"Futsal: Technique, Tactics, Training,"* Meyer & Meyer Sport, 2011.
7. Ultralytics, *"YOLOv8 Performance Metrics,"* https://docs.ultralytics.com/models/yolov8/#performance-metrics

---

## 15. Kata Kunci (Keywords)

*Object Detection, Multi-Object Tracking, YOLOv8, ByteTrack, Computer Vision, Sports Analytics, Futsal, Data Science, CRISP-DM, Heatmap, Ball Possession*
