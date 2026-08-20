from collections import defaultdict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import os
import traceback

from config import (
    MODEL_PATH,
    STORAGE_BASE,
    FRAME_SAMPLE_RATE,
    AI_WORKER_PORT,
    AI_WORKER_HOST,
    ENABLE_TEAM_CLASSIFICATION,
    ENABLE_CAMERA_COMPENSATION,
    ENABLE_HOMOGRAPHY,
    HOMOGRAPHY_SRC_POINTS,
    HOMOGRAPHY_DST_POINTS,
)
from detector import Detector
from tracker import PlayerTracker
from db import DB
from auto_tagger import detect_events
from clipper import generate_highlights
from team_classifier import classify_teams, extract_jersey_hue
from camera_compensation import CameraCompensator
from homography import HomographyTransformer

app = FastAPI(title="Futsal AI Worker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = Detector(MODEL_PATH)
db = DB()

BATCH_FLUSH_SIZE = 500
PROGRESS_INTERVAL = 500


class ProcessRequest(BaseModel):
    match_id: int
    video_path: str


class HighlightRequest(BaseModel):
    match_id: int
    video_path: str


@app.on_event("startup")
def startup():
    try:
        _ = detector.model
        print("[WORKER] YOLOv8s model loaded successfully.")
    except Exception as e:
        print(f"[WORKER] WARNING: Failed to load model: {e}")
    print(f"[WORKER] AI Worker ready on {AI_WORKER_HOST}:{AI_WORKER_PORT}")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": detector.model is not None,
    }


@app.post("/process")
def process_video(req: ProcessRequest):
    try:
        match_id = req.match_id
        video_path = req.video_path

        if not os.path.exists(video_path):
            alt_path = os.path.join(STORAGE_BASE, video_path.lstrip("/").lstrip("\\"))
            if os.path.exists(alt_path):
                video_path = alt_path
            else:
                db.update_video_status(match_id, "failed", error=f"Video not found: {video_path}")
                raise HTTPException(400, f"Video not found: {video_path}")

        db.update_video_status(match_id, "processing")

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()

        tracker = PlayerTracker()
        frame_number = 0
        processed = 0
        player_batch = []
        ball_batch = []

        compensator = CameraCompensator() if ENABLE_CAMERA_COMPENSATION else None
        homography = HomographyTransformer(HOMOGRAPHY_SRC_POINTS, HOMOGRAPHY_DST_POINTS) if ENABLE_HOMOGRAPHY else None
        hue_by_track = defaultdict(list)
        x_sum_by_track = defaultdict(float)
        x_count_by_track = defaultdict(int)

        cap = cv2.VideoCapture(video_path)

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if compensator is not None:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                compensator.update(gray)

            if frame_number % FRAME_SAMPLE_RATE == 0:
                detections = detector.detect(frame)

                tracked = tracker.update(detections, frame_number)

                h, w = frame.shape[:2]

                for t in tracked:
                    cx, cy = t["center_x"], t["center_y"]

                    if compensator is not None:
                        cx, cy = compensator.correct(cx, cy, w, h)

                    x_map = y_map = None
                    if homography is not None:
                        x_map, y_map = homography.transform_point(cx, cy)

                    if ENABLE_TEAM_CLASSIFICATION:
                        tid = t["tracking_id"]
                        hue_by_track[tid].append(extract_jersey_hue(frame, t["bbox"]))
                        x_sum_by_track[tid] += cx
                        x_count_by_track[tid] += 1

                    player_batch.append((
                        match_id, frame_number,
                        t["tracking_id"],
                        cx, cy,
                        t["confidence"],
                        "unknown",
                        x_map, y_map,
                    ))

                balls = [d for d in detections if d["class"] == "ball"]
                for b in balls:
                    bx, by = b["center_x"], b["center_y"]

                    if compensator is not None:
                        bx, by = compensator.correct(bx, by, w, h)

                    bx_map = by_map = None
                    if homography is not None:
                        bx_map, by_map = homography.transform_point(bx, by)

                    ball_batch.append((
                        match_id, frame_number,
                        bx, by,
                        b["confidence"],
                        bx_map, by_map,
                    ))

                processed += 1

                if processed % BATCH_FLUSH_SIZE == 0:
                    db.insert_player_tracks_batch(player_batch)
                    db.insert_ball_tracks_batch(ball_batch)
                    player_batch = []
                    ball_batch = []
                    print(f"[WORKER] Flushed batch at frame {frame_number} ({processed} sampled)")

                if processed % PROGRESS_INTERVAL == 0:
                    db.update_video_status(
                        match_id, "processing",
                        total_frames=frame_number,
                        fps_source=round(fps, 2),
                    )
                    print(f"[WORKER] Progress: frame {frame_number}/{total_frames}")

            frame_number += 1

        cap.release()

        if player_batch:
            db.insert_player_tracks_batch(player_batch)
        if ball_batch:
            db.insert_ball_tracks_batch(ball_batch)

        db.update_video_status(
            match_id, "done",
            total_frames=frame_number,
            fps_source=round(fps, 2),
        )

        print(f"[WORKER] Tracking done. match_id={match_id}, frames={frame_number}, sampled={processed}")

        silhouette = None
        if ENABLE_TEAM_CLASSIFICATION:
            silhouette = _run_team_classification(
                match_id, hue_by_track, x_sum_by_track, x_count_by_track
            )

        _run_auto_tagging(match_id, fps, FRAME_SAMPLE_RATE)
        _run_highlight_generation(match_id, video_path)

        return {
            "status": "done",
            "frames_processed": frame_number,
            "frames_tracked": processed,
            "fps_source": round(fps, 2),
            "team_classification": {
                "enabled": ENABLE_TEAM_CLASSIFICATION,
                "silhouette_score": silhouette,
            },
        }

    except Exception as e:
        db.update_video_status(match_id, "failed", error=str(e))
        traceback.print_exc()
        raise HTTPException(500, str(e))


def _run_team_classification(match_id, hue_by_track, x_sum_by_track, x_count_by_track):
    try:
        print(f"[WORKER] Running team classification for match {match_id}...")

        x_mean_by_track = {
            tid: x_sum_by_track[tid] / x_count_by_track[tid]
            for tid in x_sum_by_track
            if x_count_by_track[tid] > 0
        }

        result = classify_teams(dict(hue_by_track), x_mean_by_track)
        db.update_player_team_batch(match_id, result["teams"])

        print(f"[WORKER] Team classification done. silhouette={result['silhouette']}")
        print(f"[WORKER] Teams: {result['teams']}")
        return result["silhouette"]
    except Exception as e:
        print(f"[WORKER] Team classification error: {e}")
        traceback.print_exc()
        return None


def _run_auto_tagging(match_id, fps, frame_sample):
    try:
        db.update_video_status(match_id, "tagging")
        print(f"[WORKER] Running auto-tagger for match {match_id}...")

        ball_tracks = db.get_ball_tracks(match_id)
        player_tracks = db.get_player_tracks(match_id)

        events = detect_events(ball_tracks, player_tracks, fps=fps, frame_sample=frame_sample)
        print(f"[WORKER] Auto-tagger found {len(events)} events")

        if events:
            rows = []
            for evt in events:
                rows.append((
                    match_id,
                    evt["event_type"],
                    evt["minute"],
                    evt["second"],
                    f'Auto-detected {evt["event_type"]} (confidence: {evt["confidence"]})',
                ))
            db.insert_auto_events_batch(rows)
            print(f"[WORKER] Inserted {len(rows)} auto-detected events")

        db.update_video_status(match_id, "done")
    except Exception as e:
        print(f"[WORKER] Auto-tagger error: {e}")
        traceback.print_exc()
        db.update_video_status(match_id, "done")


def _run_highlight_generation(match_id, video_path):
    try:
        print(f"[WORKER] Generating highlights for match {match_id}...")

        events = db.get_match_events(match_id)
        if not events:
            print(f"[WORKER] No events found for match {match_id}, skipping highlights.")
            return

        highlights_dir = os.path.join(STORAGE_BASE, "highlights")
        result = generate_highlights(video_path, events, match_id, highlights_dir)

        print(f"[WORKER] Generated {result['count']} highlight clips")
        if result["clips"]:
            db.insert_highlights(match_id, result["clips"], result["reel"])
    except Exception as e:
        print(f"[WORKER] Highlight generation error: {e}")
        traceback.print_exc()


@app.post("/highlights")
def process_highlights(req: HighlightRequest):
    try:
        match_id = req.match_id
        video_path = req.video_path

        if not os.path.exists(video_path):
            alt_path = os.path.join(STORAGE_BASE, video_path.lstrip("/").lstrip("\\"))
            if os.path.exists(alt_path):
                video_path = alt_path
            else:
                raise HTTPException(400, f"Video not found: {video_path}")

        highlights_dir = os.path.join(STORAGE_BASE, "highlights")
        events = db.get_match_events(match_id)

        if not events:
            return {"status": "skipped", "message": "No events found", "count": 0}

        result = generate_highlights(video_path, events, match_id, highlights_dir)

        if result["clips"]:
            db.insert_highlights(match_id, result["clips"], result["reel"])

        return {
            "status": "done",
            "count": result["count"],
            "reel": bool(result["reel"]),
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=AI_WORKER_HOST, port=AI_WORKER_PORT)
