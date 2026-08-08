import numpy as np


def generate_heatmap(player_tracks, grid_cols=20, grid_rows=10):
    grid = np.zeros((grid_rows, grid_cols))
    for track in player_tracks:
        col = int(track["x"] * grid_cols)
        row = int(track["y"] * grid_rows)
        if 0 <= col < grid_cols and 0 <= row < grid_rows:
            grid[row][col] += 1
    max_val = grid.max()
    if max_val > 0:
        grid = grid / max_val
    return grid.round(4).tolist()


def calculate_possession(ball_tracks, player_tracks):
    home_count = 0
    away_count = 0
    total = 0

    balls_by_frame = {}
    for b in ball_tracks:
        f = b["frame_number"]
        if f not in balls_by_frame:
            balls_by_frame[f] = []
        balls_by_frame[f].append(b)

    players_by_frame = {}
    for p in player_tracks:
        f = p["frame_number"]
        if f not in players_by_frame:
            players_by_frame[f] = []
        players_by_frame[f].append(p)

    for frame_number, balls in balls_by_frame.items():
        players = players_by_frame.get(frame_number, [])
        if not players:
            continue
        ball = balls[0]
        nearest_team = _find_nearest_player_team(ball, players)
        if nearest_team == "home":
            home_count += 1
        elif nearest_team == "away":
            away_count += 1
        total += 1

    return {
        "home": round(home_count / total * 100, 1) if total > 0 else 50,
        "away": round(away_count / total * 100, 1) if total > 0 else 50,
    }


def calculate_distance(player_tracks):
    result = {"home": 0.0, "away": 0.0, "unknown": 0.0}

    by_tracking_id = {}
    for p in player_tracks:
        tid = p["tracking_id"]
        if tid not in by_tracking_id:
            by_tracking_id[tid] = []
        by_tracking_id[tid].append(p)

    for tid, positions in by_tracking_id.items():
        positions.sort(key=lambda x: x["frame_number"])
        team = positions[0].get("team", "unknown")
        for i in range(1, len(positions)):
            dist = np.sqrt(
                (positions[i]["x"] - positions[i - 1]["x"]) ** 2
                + (positions[i]["y"] - positions[i - 1]["y"]) ** 2
            )
            dist_meters = dist * 40
            result[team] += dist_meters

    return {
        "home": round(result["home"]),
        "away": round(result["away"]),
    }


def _find_nearest_player_team(ball, players):
    min_dist = float("inf")
    nearest_team = "unknown"
    for player in players:
        dist = np.sqrt(
            (player["x"] - ball["x"]) ** 2 + (player["y"] - ball["y"]) ** 2
        )
        if dist < min_dist:
            min_dist = dist
            nearest_team = player.get("team", "unknown")
    return nearest_team
