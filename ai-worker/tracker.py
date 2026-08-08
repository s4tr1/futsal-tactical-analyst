from config import TRACKING_LOST_TTL


def iou(box_a, box_b):
    xa1, ya1, xa2, ya2 = box_a
    xb1, yb1, xb2, yb2 = box_b

    xi1 = max(xa1, xb1)
    yi1 = max(ya1, yb1)
    xi2 = min(xa2, xb2)
    yi2 = min(ya2, yb2)

    inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
    area_a = (xa2 - xa1) * (ya2 - ya1)
    area_b = (xb2 - xb1) * (yb2 - yb1)
    union = area_a + area_b - inter_area

    return inter_area / union if union > 0 else 0


class PlayerTracker:
    def __init__(self):
        self.next_id = 1
        self.active_tracks = {}

    def update(self, detections, frame_number):
        players = [d for d in detections if d["class"] == "player"]

        if not players:
            for tid in list(self.active_tracks):
                self.active_tracks[tid]["lost_frames"] += 1
                if self.active_tracks[tid]["lost_frames"] > TRACKING_LOST_TTL:
                    del self.active_tracks[tid]
            return []

        if not self.active_tracks:
            self._assign_new_tracks(players)
            return self._format_results(frame_number)

        matched_track_ids = set()
        matched_det_ids = set()

        for tid, track in self.active_tracks.items():
            best_iou = 0.3
            best_det = None
            for det_idx, det in enumerate(players):
                if det_idx in matched_det_ids:
                    continue
                score = iou(track["bbox"], det["bbox"])
                if score > best_iou:
                    best_iou = score
                    best_det = det_idx
            if best_det is not None:
                self._update_track(tid, players[best_det], frame_number)
                matched_track_ids.add(tid)
                matched_det_ids.add(best_det)

        for i, det in enumerate(players):
            if i not in matched_det_ids:
                self.active_tracks[self.next_id] = {
                    "bbox": det["bbox"],
                    "center_x": det["center_x"],
                    "center_y": det["center_y"],
                    "confidence": det["confidence"],
                    "lost_frames": 0,
                    "last_frame": frame_number,
                }
                self.next_id += 1

        for tid in list(self.active_tracks):
            if tid not in matched_track_ids and self.active_tracks[tid]["last_frame"] != frame_number:
                self.active_tracks[tid]["lost_frames"] += 1
                if self.active_tracks[tid]["lost_frames"] > TRACKING_LOST_TTL:
                    del self.active_tracks[tid]

        return self._format_results(frame_number)

    def _assign_new_tracks(self, players):
        for det in players:
            self.active_tracks[self.next_id] = {
                "bbox": det["bbox"],
                "center_x": det["center_x"],
                "center_y": det["center_y"],
                "confidence": det["confidence"],
                "lost_frames": 0,
                "last_frame": 0,
            }
            self.next_id += 1

    def _update_track(self, tid, det, frame_number):
        alpha = 0.7
        self.active_tracks[tid]["bbox"] = [
            alpha * old + (1 - alpha) * new
            for old, new in zip(self.active_tracks[tid]["bbox"], det["bbox"])
        ]
        self.active_tracks[tid]["center_x"] = det["center_x"]
        self.active_tracks[tid]["center_y"] = det["center_y"]
        self.active_tracks[tid]["confidence"] = det["confidence"]
        self.active_tracks[tid]["lost_frames"] = 0
        self.active_tracks[tid]["last_frame"] = frame_number

    def _format_results(self, frame_number):
        return [
            {
                "tracking_id": tid,
                "center_x": t["center_x"],
                "center_y": t["center_y"],
                "confidence": t["confidence"],
                "frame_number": frame_number,
            }
            for tid, t in self.active_tracks.items()
            if t["last_frame"] == frame_number or t["lost_frames"] == 0
        ]
