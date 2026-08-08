from ultralytics import YOLO
import numpy as np


class Detector:
    def __init__(self, model_path="models/yolov8s.pt"):
        self.model = YOLO(model_path)

    def detect(self, frame: np.ndarray):
        results = self.model(frame, verbose=False, device=0)
        detections = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                cls_name = self.model.names[cls_id]
                if cls_name in ("person", "sports ball"):
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    h, w = frame.shape[:2]
                    detections.append({
                        "class": "player" if cls_name == "person" else "ball",
                        "bbox": [x1, y1, x2, y2],
                        "confidence": float(box.conf[0]),
                        "center_x": (x1 + x2) / 2 / w,
                        "center_y": (y1 + y2) / 2 / h,
                    })
        return detections
