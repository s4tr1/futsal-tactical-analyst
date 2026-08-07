<?php

namespace App\Http\Controllers;

use App\Models\MatchEvent;
use App\Models\Matches;
use App\Models\Team;
use Illuminate\Http\Request;

class MatchEventController extends Controller
{
    public function index(Request $request, $matchId)
    {
        $match = Matches::findOrFail($matchId);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        $events = $match->events()->with('player')->get();
        return response()->json(['success' => true, 'data' => $events, 'message' => 'Daftar event.']);
    }

    public function store(Request $request, $matchId)
    {
        $match = Matches::findOrFail($matchId);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        $data = $request->validate([
            'player_id'  => 'nullable|exists:players,id',
            'event_type' => 'required|in:goal,shot,foul,turnover',
            'half'       => 'required|integer|in:1,2',
            'minute'     => 'required|integer|min:0|max:40',
            'second'     => 'nullable|integer|min:0|max:59',
            'notes'      => 'nullable|string|max:255',
        ]);
        $event = MatchEvent::create(array_merge($data, ['match_id' => $matchId]));
        $event->load('player');
        return response()->json(['success' => true, 'data' => $event, 'message' => 'Event berhasil ditambahkan.'], 201);
    }

    public function destroy(Request $request, $id)
    {
        $event = MatchEvent::findOrFail($id);
        $match = Matches::findOrFail($event->match_id);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        $event->delete();
        return response()->json(['success' => true, 'data' => null, 'message' => 'Event berhasil dihapus.']);
    }
}
