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

# --- Feature toggles ---
ENABLE_TEAM_CLASSIFICATION = os.getenv("ENABLE_TEAM_CLASSIFICATION", "1") == "1"
ENABLE_CAMERA_COMPENSATION = os.getenv("ENABLE_CAMERA_COMPENSATION", "1") == "1"
ENABLE_HOMOGRAPHY = os.getenv("ENABLE_HOMOGRAPHY", "1") == "1"

# --- Team classification (jersey crop ratios, normalized bbox fractions) ---
JERSEY_X_CROP = float(os.getenv("JERSEY_X_CROP", 0.25))
JERSEY_Y1_CROP = float(os.getenv("JERSEY_Y1_CROP", 0.15))
JERSEY_Y2_CROP = float(os.getenv("JERSEY_Y2_CROP", 0.5))

# --- Camera compensation (Lucas-Kanade) ---
CAMERA_MAX_FEATURES = int(os.getenv("CAMERA_MAX_FEATURES", 200))
CAMERA_FEATURE_QUALITY = float(os.getenv("CAMERA_FEATURE_QUALITY", 0.01))
CAMERA_MIN_DISPLACEMENT = float(os.getenv("CAMERA_MIN_DISPLACEMENT", 0.5))

# --- Homography (normalized [0, 1] image -> normalized [0, 1] tactical map) ---
# Source: 4 field corners as seen in the frame (top-left, top-right,
# bottom-right, bottom-left). Destination: same corners in the top-down map.
HOMOGRAPHY_SRC_POINTS = [
    [0.05, 0.05],
    [0.95, 0.05],
    [0.95, 0.95],
    [0.05, 0.95],
]
HOMOGRAPHY_DST_POINTS = [
    [0.0, 0.0],
    [1.0, 0.0],
    [1.0, 1.0],
    [0.0, 1.0],
]
