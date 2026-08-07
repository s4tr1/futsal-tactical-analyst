<?php

namespace App\Http\Controllers;

use App\Models\Matches;
use App\Models\Team;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    public function index(Request $request, $teamId)
    {
        $team = Team::where('coach_id', $request->user()->id)->findOrFail($teamId);
        $matches = $team->matches()->orderBy('match_date', 'desc')->with('team')->get()->map(function ($m) {
            $m->result = $m->result;
            return $m;
        });
        return response()->json(['success' => true, 'data' => $matches, 'message' => 'Daftar pertandingan.']);
    }

    public function store(Request $request, $teamId)
    {
        $team = Team::where('coach_id', $request->user()->id)->findOrFail($teamId);
        $data = $request->validate([
            'opponent_name' => 'required|string|max:100',
            'match_date'    => 'required|date',
            'location'      => 'nullable|string|max:150',
            'competition'   => 'nullable|string|max:100',
            'status'        => 'in:scheduled,live,finished',
        ]);
        $match = $team->matches()->create($data);
        return response()->json(['success' => true, 'data' => $match, 'message' => 'Pertandingan berhasil dibuat.'], 201);
    }

    public function show(Request $request, $id)
    {
        $match = Matches::with(['team', 'events.player', 'video', 'tactics'])->findOrFail($id);
        if (!Team::where('coach_id', $request->user()->id)->where('id', $match->team_id)->exists()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }
        return response()->json(['success' => true, 'data' => $match, 'message' => 'Detail pertandingan.']);
    }

    public function update(Request $request, $id)
    {
        $match = Matches::findOrFail($id);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        $data = $request->validate([
            'opponent_name'  => 'sometimes|string|max:100',
            'match_date'     => 'sometimes|date',
            'location'       => 'nullable|string|max:150',
            'competition'    => 'nullable|string|max:100',
            'status'         => 'in:scheduled,live,finished',
            'score_team'     => 'sometimes|integer|min:0',
            'score_opponent' => 'sometimes|integer|min:0',
        ]);
        $match->update($data);
        $match->result = $match->result;
        return response()->json(['success' => true, 'data' => $match, 'message' => 'Pertandingan berhasil diperbarui.']);
    }

    public function destroy(Request $request, $id)
    {
        $match = Matches::findOrFail($id);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        $match->delete();
        return response()->json(['success' => true, 'data' => null, 'message' => 'Pertandingan berhasil dihapus.']);
    }
}
