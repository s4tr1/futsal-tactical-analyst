from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import os
import traceback

from config import MODEL_PATH, STORAGE_BASE, FRAME_SAMPLE_RATE, AI_WORKER_PORT, AI_WORKER_HOST
from detector import Detector
from tracker import PlayerTracker
from db import DB

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


class ProcessRequest(BaseModel):
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

        db.update_video_status(match_id, "processing")

        tracker = PlayerTracker()
        frame_number = 0
        processed = 0

        cap = cv2.VideoCapture(video_path)

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_number % FRAME_SAMPLE_RATE == 0:
                detections = detector.detect(frame)

                tracked = tracker.update(detections, frame_number)
                for t in tracked:
                    db.insert_player_track(
                        match_id, frame_number,
                        t["tracking_id"],
                        t["center_x"], t["center_y"],
                        t["confidence"],
                    )

                balls = [d for d in detections if d["class"] == "ball"]
                for b in balls:
                    db.insert_ball_track(
                        match_id, frame_number,
                        b["center_x"], b["center_y"],
                        b["confidence"],
                    )

                processed += 1

            frame_number += 1

        cap.release()

        db.update_video_status(
            match_id, "done",
            total_frames=frame_number,
            fps_source=round(fps, 2),
        )

        return {
            "status": "done",
            "frames_processed": frame_number,
            "frames_tracked": processed,
            "fps_source": round(fps, 2),
        }

    except Exception as e:
        db.update_video_status(match_id, "failed", error=str(e))
        traceback.print_exc()
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=AI_WORKER_HOST, port=AI_WORKER_PORT)
