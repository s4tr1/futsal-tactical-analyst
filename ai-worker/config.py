import os

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "futsal_tactical_analyst")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "yolov8s.pt")

STORAGE_BASE = os.getenv("STORAGE_BASE", os.path.join(os.path.dirname(__file__), "..", "backend", "storage", "app", "public"))

FRAME_SAMPLE_RATE = int(os.getenv("FRAME_SAMPLE_RATE", 5))
TRACKING_LOST_TTL = int(os.getenv("TRACKING_LOST_TTL", 30))

AI_WORKER_PORT = int(os.getenv("AI_WORKER_PORT", 8001))
AI_WORKER_HOST = os.getenv("AI_WORKER_HOST", "127.0.0.1")
