import cv2
import numpy as np

from config import (
    CAMERA_MAX_FEATURES,
    CAMERA_MIN_DISPLACEMENT,
    CAMERA_FEATURE_QUALITY,
)


class CameraCompensator:
    """Accumulate inter-frame camera shift via Lucas-Kanade optical flow.

    Call `update(gray_frame)` on every frame to estimate the camera motion,
    then `correct(x, y, w, h)` to convert a raw (normalized) position into a
    camera-stabilized position in world space.
    """

    def __init__(self):
        self.prev_gray = None
        self.total_dx = 0.0
        self.total_dy = 0.0

    def update(self, gray_frame):
        """Estimate frame-to-frame camera displacement and accumulate it.

        Args:
            gray_frame: grayscale frame (numpy array).
        """
        if gray_frame is None:
            return

        if self.prev_gray is None:
            self.prev_gray = gray_frame.copy()
            return

        prev_pts = cv2.goodFeaturesToTrack(
            self.prev_gray,
            maxCorners=CAMERA_MAX_FEATURES,
            qualityLevel=CAMERA_FEATURE_QUALITY,
            minDistance=7,
            blockSize=7,
        )

        if prev_pts is None or len(prev_pts) < 2:
            self.prev_gray = gray_frame.copy()
            return

        next_pts, status, _ = cv2.calcOpticalFlowPyrLK(
            self.prev_gray, gray_frame, prev_pts, None
        )

        if next_pts is None:
            self.prev_gray = gray_frame.copy()
            return

        status = status.reshape(-1)
        good_prev = prev_pts[status == 1].reshape(-1, 2)
        good_next = next_pts[status == 1].reshape(-1, 2)

        if len(good_prev) < 2:
            self.prev_gray = gray_frame.copy()
            return

        flow = good_next - good_prev
        dx, dy = np.median(flow, axis=0)

        if abs(dx) < CAMERA_MIN_DISPLACEMENT:
            dx = 0.0
        if abs(dy) < CAMERA_MIN_DISPLACEMENT:
            dy = 0.0

        # Background moves opposite to camera pan; accumulating the negative
        # of the flow yields the camera motion in image space.
        self.total_dx -= float(dx)
        self.total_dy -= float(dy)

        self.prev_gray = gray_frame.copy()

    def offset(self, width, height):
        """Return accumulated camera shift in normalized [0, 1] units."""
        if not width or not height:
            return 0.0, 0.0
        return self.total_dx / width, self.total_dy / height

    def correct(self, x, y, width, height):
        """Correct a normalized (x, y) point by the accumulated camera shift."""
        ox, oy = self.offset(width, height)
        return x + ox, y + oy

    def reset(self):
        self.prev_gray = None
        self.total_dx = 0.0
        self.total_dy = 0.0
