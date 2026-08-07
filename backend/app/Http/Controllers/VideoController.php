<?php

namespace App\Http\Controllers;

use App\Models\Matches;
use App\Models\Team;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VideoController extends Controller
{
    public function show(Request $request, $matchId)
    {
        $match = Matches::findOrFail($matchId);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        $video = $match->video;
        if (!$video) {
            return response()->json(['success' => false, 'data' => null, 'message' => 'Video belum diupload.'], 404);
        }
        $video->url = Storage::url($video->file_path);
        return response()->json(['success' => true, 'data' => $video, 'message' => 'Detail video.']);
    }

    public function store(Request $request, $matchId)
    {
        $match = Matches::findOrFail($matchId);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);

        $request->validate([
            'video' => 'required|file|mimes:mp4,mov,avi|max:512000',
        ]);

        if ($match->video) {
            Storage::delete($match->video->file_path);
            $match->video->delete();
        }

        $file = $request->file('video');
        $path = $file->store('videos', 'public');

        $video = Video::create([
            'match_id'      => $matchId,
            'file_path'     => $path,
            'original_name' => $file->getClientOriginalName(),
            'file_size'     => $file->getSize(),
        ]);

        $video->url = Storage::url($path);

        return response()->json(['success' => true, 'data' => $video, 'message' => 'Video berhasil diupload.'], 201);
    }
}
