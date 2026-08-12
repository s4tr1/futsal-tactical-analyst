<?php

namespace App\Http\Controllers;

use App\Jobs\TriggerAiTracking;
use App\Models\BallTrack;
use App\Models\Matches;
use App\Models\PlayerTrack;
use App\Models\Tactic;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

        if (in_array($video->tracking_status, ['queued', 'processing'])) {
            return response()->json([
                'success' => false,
                'message' => 'Tracking sedang berjalan. Tunggu hingga selesai.',
                'data' => ['status' => $video->tracking_status],
            ], 409);
        }

        $video->update([
            'tracking_status' => 'queued',
            'tracking_started_at' => now(),
            'tracking_error' => null,
        ]);

        TriggerAiTracking::dispatch(
            $matchId,
            Storage::disk('public')->path($video->file_path),
        );

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

    public function playback(Request $request, $matchId)
    {
        $this->authorizeCoach($request, $matchId);
        $video = Matches::findOrFail($matchId)->video;

        $performStep = (int) $request->get('step', 1);
        $maxFrames = (int) $request->get('max_frames', 0);

        $players = PlayerTrack::where('match_id', $matchId)
            ->orderBy('frame_number')
            ->get();

        $balls = BallTrack::where('match_id', $matchId)
            ->orderBy('frame_number')
            ->get();

        $playersByFrame = [];
        foreach ($players as $p) {
            $fn = (int) floor($p->frame_number / $performStep) * $performStep;
            if (!isset($playersByFrame[$fn])) $playersByFrame[$fn] = [];
            $playersByFrame[$fn][] = $p;
        }

        $ballsByFrame = [];
        foreach ($balls as $b) {
            $fn = (int) floor($b->frame_number / $performStep) * $performStep;
            if (!isset($ballsByFrame[$fn])) $ballsByFrame[$fn] = [];
            $ballsByFrame[$fn][] = $b;
        }

        $frameNumbers = array_keys($playersByFrame);
        sort($frameNumbers);
        if ($maxFrames > 0) $frameNumbers = array_slice($frameNumbers, 0, $maxFrames);

        $frames = [];
        foreach ($frameNumbers as $fn) {
            $framePlayers = $playersByFrame[$fn] ?? [];
            $frameBall = $ballsByFrame[$fn] ?? [];

            $frames[] = [
                'frame_number' => (int) $fn,
                'players' => array_values(array_map(fn($p) => [
                    'tracking_id' => $p->tracking_id,
                    'x' => round($p->x, 4),
                    'y' => round($p->y, 4),
                    'team' => $p->team,
                ], $framePlayers)),
                'ball' => !empty($frameBall) ? [
                    'x' => round($frameBall[0]->x, 4),
                    'y' => round($frameBall[0]->y, 4),
                ] : null,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'fps' => $video?->fps_source ?? 30,
                'sample_rate' => (int) config('ai-worker.FRAME_SAMPLE_RATE', 5),
                'frame_count' => count($frames),
                'frames' => $frames,
            ],
        ]);
    }

    public function snapshotToTactic(Request $request, $matchId)
    {
        $this->authorizeCoach($request, $matchId);

        $validated = $request->validate([
            'frame_number' => 'required|integer|min:0',
            'name' => 'required|string|max:100',
        ]);

        $frameNumber = $validated['frame_number'];
        $name = $validated['name'];

        $players = PlayerTrack::where('match_id', $matchId)
            ->where('frame_number', $frameNumber)
            ->get();

        $ball = BallTrack::where('match_id', $matchId)
            ->where('frame_number', $frameNumber)
            ->first();

        if ($players->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'No tracking data at this frame.'], 404);
        }

        $homePlayers = $players->where('team', 'home');
        $awayPlayers = $players->where('team', 'away');
        $unknownPlayers = $players->where('team', 'unknown');

        $homeTokens = $homePlayers->values()->map(fn($p, $i) => [
            'id' => 't_h_' . $p->tracking_id,
            'number' => $i + 1,
            'x' => round($p->x * 800, 1),
            'y' => round($p->y * 520, 1),
        ])->toArray();

        if ($homeTokens === []) {
            $homeTokens = $unknownPlayers->take(5)->values()->map(fn($p, $i) => [
                'id' => 't_h_' . $p->tracking_id,
                'number' => $i + 1,
                'x' => round($p->x * 800, 1),
                'y' => round($p->y * 520, 1),
            ])->toArray();

            $awayTokens = $players->whereNotIn('tracking_id', $unknownPlayers->take(5)->pluck('tracking_id'))
                ->values()->map(fn($p, $i) => [
                    'id' => 't_a_' . $p->tracking_id,
                    'number' => $i + 1,
                    'x' => round($p->x * 800, 1),
                    'y' => round($p->y * 520, 1),
                ])->toArray();
        } else {
            $awayTokens = $awayPlayers->values()->map(fn($p, $i) => [
                'id' => 't_a_' . $p->tracking_id,
                'number' => $i + 1,
                'x' => round($p->x * 800, 1),
                'y' => round($p->y * 520, 1),
            ])->toArray();

            if ($awayTokens === []) {
                $awayTokens = $players->whereNotIn('tracking_id', $homePlayers->pluck('tracking_id'))
                    ->values()->map(fn($p, $i) => [
                        'id' => 't_a_' . $p->tracking_id,
                        'number' => $i + 1,
                        'x' => round($p->x * 800, 1),
                        'y' => round($p->y * 520, 1),
                    ])->toArray();
            }
        }

        $canvasJson = [
            'teamA' => $homeTokens,
            'teamB' => $awayTokens,
            'arrows' => [],
            'zones' => [],
            'texts' => [],
            'ball' => $ball ? [
                'x' => round($ball->x * 800, 1),
                'y' => round($ball->y * 520, 1),
            ] : null,
        ];

        $tactic = Tactic::create([
            'match_id' => $matchId,
            'name' => $name,
            'canvas_json' => $canvasJson,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => $tactic,
            'message' => 'Tactic saved from tracking snapshot.',
        ], 201);
    }
}
