<?php

namespace App\Http\Controllers;

use App\Models\Matches;
use App\Models\Tactic;
use App\Models\Team;
use Illuminate\Http\Request;

class TacticController extends Controller
{
    public function index(Request $request, $matchId)
    {
        $match = Matches::findOrFail($matchId);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        $tactics = $match->tactics()->with('creator:id,name')->get();
        return response()->json(['success' => true, 'data' => $tactics, 'message' => 'Daftar taktik.']);
    }

    public function store(Request $request, $matchId)
    {
        $match = Matches::findOrFail($matchId);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'canvas_json' => 'required|array',
        ]);
        $tactic = Tactic::create(array_merge($data, [
            'match_id'   => $matchId,
            'created_by' => $request->user()->id,
        ]));
        return response()->json(['success' => true, 'data' => $tactic, 'message' => 'Taktik berhasil disimpan.'], 201);
    }

    public function show(Request $request, $id)
    {
        $tactic = Tactic::with('creator:id,name')->findOrFail($id);
        $match = Matches::findOrFail($tactic->match_id);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        return response()->json(['success' => true, 'data' => $tactic, 'message' => 'Detail taktik.']);
    }

    public function destroy(Request $request, $id)
    {
        $tactic = Tactic::findOrFail($id);
        $match  = Matches::findOrFail($tactic->match_id);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        $tactic->delete();
        return response()->json(['success' => true, 'data' => null, 'message' => 'Taktik berhasil dihapus.']);
    }
}
