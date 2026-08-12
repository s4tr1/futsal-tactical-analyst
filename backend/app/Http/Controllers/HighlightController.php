<?php

namespace App\Http\Controllers;

use App\Models\Highlight;
use App\Models\Matches;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class HighlightController extends Controller
{
    private function authorizeCoach(Request $request, $matchId): Matches
    {
        $match = Matches::findOrFail($matchId);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        return $match;
    }

    public function index(Request $request, $matchId)
    {
        $this->authorizeCoach($request, $matchId);

        $highlights = Highlight::where('match_id', $matchId)
            ->orderBy('event_type')
            ->orderBy('start_second')
            ->get()
            ->map(function ($h) {
                $h->url = Storage::url($h->clip_path);
                return $h;
            });

        $reel = $highlights->firstWhere('event_type', 'reel');
        $clips = $highlights->where('event_type', '!=', 'reel')->values();

        return response()->json([
            'success' => true,
            'data' => [
                'clips' => $clips,
                'reel' => $reel,
                'total' => $clips->count(),
            ],
            'message' => 'List highlight clips.',
        ]);
    }

    public function generate(Request $request, $matchId)
    {
        $match = $this->authorizeCoach($request, $matchId);
        $video = $match->video;

        if (!$video) {
            return response()->json(['success' => false, 'message' => 'Upload video terlebih dahulu.'], 400);
        }

        Highlight::where('match_id', $matchId)->delete();

        $videoPath = Storage::disk('public')->path($video->file_path);

        Log::info("HighlightController: requesting highlights for match {$matchId}");

        $response = Http::timeout(10)->post('http://127.0.0.1:8001/highlights', [
            'match_id' => $matchId,
            'video_path' => $videoPath,
        ]);

        if ($response->failed()) {
            Log::error("HighlightController: AI worker returned error: {$response->status()}");
            return response()->json(['success' => false, 'message' => 'Gagal generate highlights.'], 500);
        }

        return response()->json([
            'success' => true,
            'data' => $response->json(),
            'message' => 'Highlight generation queued.',
        ]);
    }

    public function download(Request $request, $id)
    {
        $highlight = Highlight::findOrFail($id);
        $match = Matches::findOrFail($highlight->match_id);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);

        $path = Storage::disk('public')->path($highlight->clip_path);

        if (!file_exists($path)) {
            return response()->json(['success' => false, 'message' => 'File tidak ditemukan.'], 404);
        }

        $filename = $highlight->event_type === 'reel'
            ? "Futsight-Highlight-Reel-Match-{$highlight->match_id}.mp4"
            : 'Futsight-Highlight-Clip-' . ($highlight->start_second ?? 0) . 's.mp4';

        return response()->download($path, $filename);
    }
}
