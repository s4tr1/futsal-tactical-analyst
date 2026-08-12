import pymysql
import os
from config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME


class DB:
    def __init__(self):
        self.conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset="utf8mb4",
            autocommit=True,
        )

    def update_video_status(self, match_id, status, error=None, total_frames=0, fps_source=None):
        cursor = self.conn.cursor()
        if status == "processing":
            cursor.execute(
                "UPDATE videos SET tracking_status=%s, tracking_started_at=NOW(), tracking_error=NULL WHERE match_id=%s",
                (status, match_id),
            )
        elif status == "done":
            cursor.execute(
                "UPDATE videos SET tracking_status=%s, tracking_finished_at=NOW(), total_frames_processed=%s, fps_source=%s WHERE match_id=%s",
                (status, total_frames, fps_source, match_id),
            )
        elif status == "failed":
            cursor.execute(
                "UPDATE videos SET tracking_status=%s, tracking_finished_at=NOW(), tracking_error=%s WHERE match_id=%s",
                (status, error, match_id),
            )
        else:
            cursor.execute(
                "UPDATE videos SET tracking_status=%s WHERE match_id=%s",
                (status, match_id),
            )
        cursor.close()

    def insert_player_track(self, match_id, frame_number, tracking_id, x, y, confidence, team="unknown"):
        cursor = self.conn.cursor()
        cursor.execute(
            "INSERT INTO player_tracks (match_id, frame_number, tracking_id, x, y, confidence, team) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (match_id, frame_number, tracking_id, round(x, 6), round(y, 6), round(confidence, 4), team),
        )
        cursor.close()

    def insert_player_tracks_batch(self, rows):
        if not rows:
            return
        cursor = self.conn.cursor()
        sql = "INSERT INTO player_tracks (match_id, frame_number, tracking_id, x, y, confidence, team) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cursor.executemany(sql, [
            (r[0], r[1], r[2], round(r[3], 6), round(r[4], 6), round(r[5], 4), r[6])
            for r in rows
        ])
        cursor.close()

    def insert_ball_track(self, match_id, frame_number, x, y, confidence):
        cursor = self.conn.cursor()
        cursor.execute(
            "INSERT INTO ball_tracks (match_id, frame_number, x, y, confidence) VALUES (%s, %s, %s, %s, %s)",
            (match_id, frame_number, round(x, 6), round(y, 6), round(confidence, 4)),
        )
        cursor.close()

    def insert_ball_tracks_batch(self, rows):
        if not rows:
            return
        cursor = self.conn.cursor()
        sql = "INSERT INTO ball_tracks (match_id, frame_number, x, y, confidence) VALUES (%s, %s, %s, %s, %s)"
        cursor.executemany(sql, [
            (r[0], r[1], round(r[2], 6), round(r[3], 6), round(r[4], 4))
            for r in rows
        ])
        cursor.close()

    def insert_auto_events_batch(self, rows):
        if not rows:
            return
        cursor = self.conn.cursor()
        sql = "INSERT INTO match_events (match_id, player_id, event_type, half, minute, second, notes, created_at, updated_at) VALUES (%s, NULL, %s, 1, %s, %s, %s, NOW(), NOW())"
        cursor.executemany(sql, [
            (r[0], r[1], r[2], r[3], r[4])
            for r in rows
        ])
        cursor.close()

    def get_player_tracks(self, match_id):
        cursor = self.conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute(
            "SELECT * FROM player_tracks WHERE match_id=%s ORDER BY frame_number",
            (match_id,),
        )
        rows = cursor.fetchall()
        cursor.close()
        return rows

    def get_ball_tracks(self, match_id):
        cursor = self.conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute(
            "SELECT * FROM ball_tracks WHERE match_id=%s ORDER BY frame_number",
            (match_id,),
        )
        rows = cursor.fetchall()
        cursor.close()
        return rows

    def get_video_path(self, match_id):
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT file_path FROM videos WHERE match_id=%s",
            (match_id,),
        )
        row = cursor.fetchone()
        cursor.close()
        return row[0] if row else None

    def get_match_events(self, match_id):
        cursor = self.conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute(
            "SELECT id, event_type, minute, second FROM match_events WHERE match_id=%s ORDER BY minute, second",
            (match_id,),
        )
        rows = cursor.fetchall()
        cursor.close()
        return rows

    def insert_highlights(self, match_id, clips, reel_path=None):
        cursor = self.conn.cursor()
        for clip in clips:
            rel_path = os.path.relpath(clip["path"], os.path.join(os.path.dirname(__file__), "..", "backend", "storage", "app", "public"))
            cursor.execute(
                "INSERT INTO highlights (match_id, clip_path, start_second, end_second, event_type, created_at) VALUES (%s, %s, %s, %s, %s, NOW())",
                (match_id, rel_path.replace("\\", "/"), clip["start_second"], clip["end_second"], clip["event_type"]),
            )

        if reel_path:
            rel_reel = os.path.relpath(reel_path, os.path.join(os.path.dirname(__file__), "..", "backend", "storage", "app", "public"))
            cursor.execute(
                "INSERT INTO highlights (match_id, clip_path, start_second, end_second, event_type, created_at) VALUES (%s, %s, NULL, NULL, %s, NOW())",
                (match_id, rel_reel.replace("\\", "/"), "reel"),
            )
        cursor.close()
