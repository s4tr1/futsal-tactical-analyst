import numpy as np


def detect_events(ball_tracks, player_tracks, fps=30, frame_sample=5):
    events = []

    if not ball_tracks or len(ball_tracks) < 3:
        return events

    ball_by_frame = {}
    for b in ball_tracks:
        ball_by_frame[b["frame_number"]] = b

    sorted_frames = sorted(ball_by_frame.keys())

    goal_zone_top = 0.0
    goal_zone_bottom = 0.35
    goal_zone_top2 = 0.65
    goal_zone_bottom2 = 1.0

    for i in range(2, len(sorted_frames)):
        f_prev2 = sorted_frames[i - 2]
        f_prev = sorted_frames[i - 1]
        f_curr = sorted_frames[i]

        b2 = ball_by_frame[f_prev2]
        b1 = ball_by_frame[f_prev]
        b0 = ball_by_frame[f_curr]

        near_goal_top = (
            b0["y"] <= goal_zone_top
            and b2["y"] > goal_zone_top + 0.02
        )
        near_goal_bottom = (
            b0["y"] >= goal_zone_bottom2
            and b2["y"] < goal_zone_bottom2 - 0.02
        )

        if near_goal_top or near_goal_bottom:
            if b0.get("confidence", 0) > 0.5:
                events.append({
                    "minute": int(f_curr / (fps * 60)) if fps > 0 else 0,
                    "second": int((f_curr / fps) % 60) if fps > 0 else 0,
                    "event_type": "goal",
                    "confidence": round(b0.get("confidence", 0), 2),
                })

    return events
