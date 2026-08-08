<?php

namespace App\Http\Controllers;

use App\Models\BallTrack;
use App\Models\Matches;
use App\Models\PlayerTrack;
use App\Models\Team;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    private function authorizeCoach(Request $request, $matchId): Matches
    {
        $match = Matches::findOrFail($matchId);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        return $match;
    }

    public function queue(Request $request, $matchId)
    {
        $match = $this->authorizeCoach($request, $matchId);

        $video = $match->video;
        if (!$video) {
            return response()->json(['success' => false, 'message' => 'Upload video terlebih dahulu.'], 400);
        }

        $video->update([
            'tracking_status' => 'queued',
            'tracking_started_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => ['status' => 'queued'],
            'message' => 'Tracking queued. AI worker will process shortly.',
        ]);
    }

    public function status(Request $request, $matchId)
    {
        $match = $this->authorizeCoach($request, $matchId);
        $video = $match->video;

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $video?->tracking_status ?? 'none',
                'progress' => $video && $video->total_frames_processed > 0 && $video->fps_source
                    ? min(100, round(($video->total_frames_processed / ($video->fps_source * 90 * 60)) * 100))
                    : ($video?->tracking_status === 'done' ? 100 : 0),
                'total_frames_processed' => $video?->total_frames_processed ?? 0,
                'started_at' => $video?->tracking_started_at,
                'finished_at' => $video?->tracking_finished_at,
            ],
        ]);
    }

    public function players(Request $request, $matchId)
    {
        $this->authorizeCoach($request, $matchId);

        $query = PlayerTrack::where('match_id', $matchId)
            ->orderBy('frame_number');

        if ($request->has('tracking_id')) {
            $query->where('tracking_id', $request->integer('tracking_id'));
        }
        if ($request->has('start_frame')) {
            $query->where('frame_number', '>=', $request->integer('start_frame'));
        }
        if ($request->has('end_frame') && $request->integer('end_frame') > 0) {
            $query->where('frame_number', '<=', $request->integer('end_frame'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function ball(Request $request, $matchId)
    {
        $this->authorizeCoach($request, $matchId);

        $query = BallTrack::where('match_id', $matchId)
            ->orderBy('frame_number');

        if ($request->has('start_frame')) {
            $query->where('frame_number', '>=', $request->integer('start_frame'));
        }
        if ($request->has('end_frame') && $request->integer('end_frame') > 0) {
            $query->where('frame_number', '<=', $request->integer('end_frame'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function heatmap(Request $request, $matchId)
    {
        $this->authorizeCoach($request, $matchId);

        $type = $request->get('type', 'players');
        $gridCols = 20;
        $gridRows = 10;

        if ($type === 'ball') {
            $tracks = BallTrack::where('match_id', $matchId)->get();
        } else {
            $tracks = PlayerTrack::where('match_id', $matchId)->get();
        }

        $grid = array_fill(0, $gridRows, array_fill(0, $gridCols, 0));
        $maxVal = 0;

        foreach ($tracks as $track) {
            $col = (int) floor($track->x * $gridCols);
            $row = (int) floor($track->y * $gridRows);
            if ($col >= 0 && $col < $gridCols && $row >= 0 && $row < $gridRows) {
                $grid[$row][$col]++;
                if ($grid[$row][$col] > $maxVal) {
                    $maxVal = $grid[$row][$col];
                }
            }
        }

        if ($maxVal > 0) {
            foreach ($grid as &$row) {
                foreach ($row as &$cell) {
                    $cell = round($cell / $maxVal, 4);
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'grid_size' => ['cols' => $gridCols, 'rows' => $gridRows],
                'cells' => $grid,
            ],
        ]);
    }

    public function summary(Request $request, $matchId)
    {
        $this->authorizeCoach($request, $matchId);

        $ballTracks = BallTrack::where('match_id', $matchId)->get();
        $playerTracks = PlayerTrack::where('match_id', $matchId)->get();

        $homePossession = 0;
        $awayPossession = 0;
        $totalFrames = 0;
        $homeDistance = 0;
        $awayDistance = 0;
        $unknownDistance = 0;

        $frames = $ballTracks->groupBy('frame_number');
        foreach ($frames as $frameNumber => $ballsInFrame) {
            $playersInFrame = $playerTracks->where('frame_number', $frameNumber);
            $ball = $ballsInFrame->first();

            $nearestTeam = 'unknown';
            $minDist = PHP_FLOAT_MAX;
            foreach ($playersInFrame as $player) {
                $dist = sqrt(pow($player->x - $ball->x, 2) + pow($player->y - $ball->y, 2));
                if ($dist < $minDist) {
                    $minDist = $dist;
                    $nearestTeam = $player->team;
                }
            }

            if ($nearestTeam === 'home') $homePossession++;
            elseif ($nearestTeam === 'away') $awayPossession++;
            $totalFrames++;
        }

        $ballPossession = [
            'home' => $totalFrames > 0 ? round($homePossession / $totalFrames * 100, 1) : 50,
            'away' => $totalFrames > 0 ? round($awayPossession / $totalFrames * 100, 1) : 50,
        ];

        $grouped = $playerTracks->groupBy('tracking_id');
        foreach ($grouped as $trackId => $positions) {
            $positions = $positions->sortBy('frame_number')->values();
            $team = $positions->first()->team;
            for ($i = 1; $i < count($positions); $i++) {
                $dist = sqrt(
                    pow($positions[$i]->x - $positions[$i - 1]->x, 2) +
                    pow($positions[$i]->y - $positions[$i - 1]->y, 2)
                );
                $distMeters = $dist * 40;
                if ($team === 'home') $homeDistance += $distMeters;
                elseif ($team === 'away') $awayDistance += $distMeters;
                else $unknownDistance += $distMeters;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'ball_possession' => $ballPossession,
                'distance_covered' => [
                    'home' => round($homeDistance),
                    'away' => round($awayDistance),
                ],
                'total_frames_tracked' => $totalFrames,
                'total_player_datapoints' => $playerTracks->count(),
                'total_ball_datapoints' => $ballTracks->count(),
            ],
        ]);
    }
}
