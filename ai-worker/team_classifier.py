import cv2
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

from config import (
    JERSEY_X_CROP,
    JERSEY_Y1_CROP,
    JERSEY_Y2_CROP,
)


def extract_jersey_hue(frame, bbox):
    """Extract median Hue from the jersey area (upper-middle) of a player bbox.

    Args:
        frame: BGR image (numpy array).
        bbox: [x1, y1, x2, y2] in pixel coordinates.

    Returns:
        float Hue in OpenCV range [0, 179], or None if the crop is invalid.
    """
    if frame is None or bbox is None:
        return None

    h, w = frame.shape[:2]
    x1, y1, x2, y2 = bbox

    cx1 = int(x1 + (x2 - x1) * JERSEY_X_CROP)
    cx2 = int(x2 - (x2 - x1) * JERSEY_X_CROP)
    cy1 = int(y1 + (y2 - y1) * JERSEY_Y1_CROP)
    cy2 = int(y1 + (y2 - y1) * JERSEY_Y2_CROP)

    if cx1 >= cx2 or cy1 >= cy2:
        return None

    cx1 = max(0, min(cx1, w - 1))
    cx2 = max(0, min(cx2, w))
    cy1 = max(0, min(cy1, h - 1))
    cy2 = max(0, min(cy2, h))

    crop = frame[cy1:cy2, cx1:cx2]
    if crop.size == 0:
        return None

    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    hue_channel = hsv[:, :, 0].flatten()
    if hue_channel.size == 0:
        return None

    return float(np.median(hue_channel))


def classify_teams(hue_by_track, x_by_track):
    """Cluster players into 2 teams via K-Means on median jersey Hue.

    Args:
        hue_by_track: dict {tracking_id: [hue, ...]} of sampled hues.
        x_by_track: dict {tracking_id: float} mean normalized x position.

    Returns:
        dict with keys:
            teams: {tracking_id: "home" | "away"}
            silhouette: float score (or None if not computable)
    """
    track_ids = sorted(hue_by_track.keys())
    features = []
    valid_ids = []

    for tid in track_ids:
        hues = [h for h in hue_by_track[tid] if h is not None]
        if not hues:
            continue
        valid_ids.append(tid)
        features.append(float(np.median(hues)))

    if len(valid_ids) < 2:
        return {"teams": {tid: "unknown" for tid in track_ids}, "silhouette": None}

    X = np.array(features, dtype=np.float64).reshape(-1, 1)

    k = 2 if len(valid_ids) >= 2 else 1
    kmeans = KMeans(n_clusters=k, n_init=10, random_state=42).fit(X)
    labels = kmeans.labels_

    silhouette = None
    if k == 2 and len(valid_ids) >= 3:
        try:
            silhouette = float(silhouette_score(X, labels))
        except ValueError:
            silhouette = None

    teams = {}
    if k == 2:
        left_cluster = _home_cluster(labels, valid_ids, x_by_track)
        for tid, label in zip(valid_ids, labels):
            teams[tid] = "home" if label == left_cluster else "away"
    else:
        for tid in valid_ids:
            teams[tid] = "home"

    for tid in track_ids:
        if tid not in teams:
            teams[tid] = "unknown"

    return {"teams": teams, "silhouette": silhouette}


def _home_cluster(labels, valid_ids, x_by_track):
    """Determine which cluster is 'home' by lower mean x position (left side)."""
    cluster_x_mean = {}
    for tid, label in zip(valid_ids, labels):
        x = x_by_track.get(tid)
        if x is None:
            continue
        cluster_x_mean.setdefault(int(label), []).append(x)

    means = {label: float(np.mean(xs)) for label, xs in cluster_x_mean.items()}
    if not means:
        return int(labels[0])

    return min(means, key=means.get)
