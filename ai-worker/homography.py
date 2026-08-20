import cv2
import numpy as np


class HomographyTransformer:
    """Map normalized image coordinates onto a top-down tactical map.

    The homography matrix is computed from 4 field corner points (source, in
    normalized [0, 1] image space) to 4 corresponding map points (destination,
    in normalized [0, 1] tactical-map space). Both point sets are configurable
    and must NOT be hardcoded by callers.
    """

    def __init__(self, src_pts, dst_pts):
        if len(src_pts) != 4 or len(dst_pts) != 4:
            raise ValueError("Homography requires exactly 4 source and 4 destination points")

        self.src_pts = np.array(src_pts, dtype=np.float32).reshape(-1, 1, 2)
        self.dst_pts = np.array(dst_pts, dtype=np.float32).reshape(-1, 1, 2)
        self.H = cv2.getPerspectiveTransform(self.src_pts, self.dst_pts)

    def transform_point(self, x, y):
        """Transform a single normalized (x, y) point into map coordinates.

        Args:
            x, y: coordinates in normalized [0, 1] image space.

        Returns:
            (x_map, y_map) tuple in normalized tactical-map space.
        """
        point = np.array([[[float(x), float(y)]]], dtype=np.float32)
        mapped = cv2.perspectiveTransform(point, self.H)
        mx, my = mapped[0][0]
        return float(mx), float(my)

    def transform_points(self, points):
        """Transform a list of (x, y) points, returning [(x_map, y_map), ...]."""
        return [self.transform_point(x, y) for x, y in points]
