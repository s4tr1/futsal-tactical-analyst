<?php

namespace App\Http\Controllers;

use App\Models\Matches;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function generate(Request $request, $matchId)
    {
        $match = Matches::with(['team', 'events.player', 'tactics'])->findOrFail($matchId);
        $events = $match->events;

        $stats = [
            'goals'    => $events->where('event_type', 'goal')->count(),
            'shots'    => $events->where('event_type', 'shot')->count(),
            'fouls'    => $events->where('event_type', 'foul')->count(),
            'turnovers'=> $events->where('event_type', 'turnover')->count(),
        ];
        $total = $stats['goals'] + $stats['shots'];
        $stats['shot_accuracy'] = $total > 0 ? round(($stats['goals'] / $total) * 100, 1) : 0;

        $pdf = Pdf::loadView('reports.match', compact('match', 'stats', 'events'));

        return $pdf->download("match-report-{$matchId}.pdf");
    }
}
