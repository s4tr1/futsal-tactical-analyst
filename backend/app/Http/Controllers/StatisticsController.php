<?php

namespace App\Http\Controllers;

use App\Models\MatchEvent;
use App\Models\Matches;
use App\Models\Team;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    public function show(Request $request, $matchId)
    {
        $match = Matches::with('events.player')->findOrFail($matchId);
        Team::where('coach_id', $request->user()->id)->findOrFail($match->team_id);
        $events = $match->events;

        $goals    = $events->where('event_type', 'goal')->count();
        $shots    = $events->where('event_type', 'shot')->count();
        $fouls    = $events->where('event_type', 'foul')->count();
        $turnovers = $events->where('event_type', 'turnover')->count();
        $totalShots = $goals + $shots;
        $shotAccuracy = $totalShots > 0 ? round(($goals / $totalShots) * 100, 1) : 0;

        // Estimated Ball Control Index: based on positive events vs total events
        $totalEvents = $events->count();
        $positiveEvents = $goals + $shots;
        $ballControlIndex = $totalEvents > 0 ? round(($positiveEvents / ($positiveEvents + $turnovers + $fouls + 1)) * 100, 1) : 0;

        // Per-player stats
        $playerStats = $events->whereNotNull('player_id')->groupBy('player_id')->map(function ($playerEvents, $playerId) {
            $player = $playerEvents->first()->player;
            return [
                'player_id'   => $playerId,
                'name'        => $player?->name,
                'jersey'      => $player?->jersey_number,
                'goals'       => $playerEvents->where('event_type', 'goal')->count(),
                'shots'       => $playerEvents->where('event_type', 'shot')->count(),
                'fouls'       => $playerEvents->where('event_type', 'foul')->count(),
                'turnovers'   => $playerEvents->where('event_type', 'turnover')->count(),
            ];
        })->values();

        $data = [
            'match_id'          => $matchId,
            'goals'             => $goals,
            'shots'             => $shots,
            'fouls'             => $fouls,
            'turnovers'         => $turnovers,
            'shot_accuracy'     => $shotAccuracy,
            'ball_control_index'=> $ballControlIndex,
            'player_stats'      => $playerStats,
            'half_breakdown'    => [
                'first_half'  => $events->where('half', 1)->groupBy('event_type')->map->count(),
                'second_half' => $events->where('half', 2)->groupBy('event_type')->map->count(),
            ],
        ];

        return response()->json(['success' => true, 'data' => $data, 'message' => 'Statistik pertandingan.']);
    }
}
