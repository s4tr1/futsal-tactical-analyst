<?php

namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function index(Request $request)
    {
        $teams = $request->user()->ownedTeams()->withCount('players')->get();
        return response()->json(['success' => true, 'data' => $teams, 'message' => 'Daftar tim.']);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:100']);
        $team = Team::create(['name' => $data['name'], 'coach_id' => $request->user()->id]);
        return response()->json(['success' => true, 'data' => $team, 'message' => 'Tim berhasil dibuat.'], 201);
    }

    public function show(Request $request, $id)
    {
        $team = Team::where('coach_id', $request->user()->id)->with(['players', 'matches'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $team, 'message' => 'Detail tim.']);
    }

    public function update(Request $request, $id)
    {
        $team = Team::where('coach_id', $request->user()->id)->findOrFail($id);
        $data = $request->validate(['name' => 'sometimes|string|max:100']);
        $team->update($data);
        return response()->json(['success' => true, 'data' => $team, 'message' => 'Tim berhasil diperbarui.']);
    }

    public function destroy(Request $request, $id)
    {
        $team = Team::where('coach_id', $request->user()->id)->findOrFail($id);
        $team->delete();
        return response()->json(['success' => true, 'data' => null, 'message' => 'Tim berhasil dihapus.']);
    }
}
