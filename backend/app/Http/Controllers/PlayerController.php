<?php

namespace App\Http\Controllers;

use App\Models\Player;
use App\Models\Team;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    public function index(Request $request, $teamId)
    {
        $team = Team::where('coach_id', $request->user()->id)->findOrFail($teamId);
        $players = $team->players()->orderBy('jersey_number')->get();
        return response()->json(['success' => true, 'data' => $players, 'message' => 'Daftar pemain.']);
    }

    public function store(Request $request, $teamId)
    {
        $team = Team::where('coach_id', $request->user()->id)->findOrFail($teamId);
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'jersey_number' => 'required|integer|min:1|max:99',
            'position'      => 'nullable|string|max:50',
        ]);
        $player = $team->players()->create($data);
        return response()->json(['success' => true, 'data' => $player, 'message' => 'Pemain berhasil ditambahkan.'], 201);
    }

    public function update(Request $request, $id)
    {
        $player = Player::findOrFail($id);
        $team = Team::where('coach_id', $request->user()->id)->findOrFail($player->team_id);
        $data = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'jersey_number' => 'sometimes|integer|min:1|max:99',
            'position'      => 'nullable|string|max:50',
        ]);
        $player->update($data);
        return response()->json(['success' => true, 'data' => $player, 'message' => 'Pemain berhasil diperbarui.']);
    }

    public function destroy(Request $request, $id)
    {
        $player = Player::findOrFail($id);
        Team::where('coach_id', $request->user()->id)->findOrFail($player->team_id);
        $player->delete();
        return response()->json(['success' => true, 'data' => null, 'message' => 'Pemain berhasil dihapus.']);
    }
}
