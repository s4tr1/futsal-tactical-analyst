import subprocess
import os
import tempfile
from config import STORAGE_BASE

CLIP_BEFORE_SEC = 15
CLIP_AFTER_SEC = 10


def extract_clip(video_path, start_sec, end_sec, output_path):
    """Extract a clip from video using ffmpeg with fast seeking."""
    duration = end_sec - start_sec
    if duration < 1:
        return None

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start_sec),
        "-i", video_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "-loglevel", "error",
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[CLIPPER] ffmpeg error: {result.stderr}")
        return None
    return output_path


def generate_reel(clip_paths, output_path, video_fps=30):
    """Concatenate multiple clips into a highlight reel."""
    if not clip_paths:
        return None

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    concat_file = tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False)
    try:
        for cp in clip_paths:
            if os.path.exists(cp):
                concat_file.write(f"file '{cp.replace(os.sep, '/')}'\n")
        concat_file.close()

        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_file.name,
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            "-loglevel", "error",
            output_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"[CLIPPER] ffmpeg concat error: {result.stderr}")
            return None
        return output_path
    finally:
        os.unlink(concat_file.name)


def generate_highlights(video_path, events, match_id, highlights_dir, fps=30):
    """Generate highlight clips for all detected events and a combined reel."""
    clips = []
    output_dir = os.path.join(highlights_dir, str(match_id))
    os.makedirs(output_dir, exist_ok=True)

    for i, evt in enumerate(events):
        event_second = evt["minute"] * 60 + evt["second"]
        start = max(0, event_second - CLIP_BEFORE_SEC)
        end = event_second + CLIP_AFTER_SEC

        event_type = evt.get("event_type", "event")
        clip_name = f"clip_{i+1:03d}_{event_type}_{evt['minute']}m{evt['second']}s.mp4"
        clip_path = os.path.join(output_dir, clip_name)

        result = extract_clip(video_path, start, end, clip_path)
        if result:
            clips.append({
                "path": result,
                "start_second": start,
                "end_second": end,
                "event_type": event_type,
                "minute": evt["minute"],
                "second": evt["second"],
            })

    reel_path = None
    if len(clips) > 1:
        reel_path = os.path.join(output_dir, "highlight_reel.mp4")
        clip_paths = [c["path"] for c in clips]
        generate_reel(clip_paths, reel_path)

    return {
        "clips": clips,
        "reel": reel_path,
        "count": len(clips),
    }
