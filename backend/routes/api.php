<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\MatchEventController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\TacticController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TrackingController;
use App\Http\Controllers\VideoController;
use Illuminate\Support\Facades\Route;

// Public Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Teams
    Route::apiResource('teams', TeamController::class);

    // Players (nested under team)
    Route::get('teams/{teamId}/players', [PlayerController::class, 'index']);
    Route::post('teams/{teamId}/players', [PlayerController::class, 'store']);
    Route::put('players/{id}', [PlayerController::class, 'update']);
    Route::delete('players/{id}', [PlayerController::class, 'destroy']);

    // Matches (nested under team)
    Route::get('teams/{teamId}/matches', [MatchController::class, 'index']);
    Route::post('teams/{teamId}/matches', [MatchController::class, 'store']);
    Route::get('matches/{id}', [MatchController::class, 'show']);
    Route::put('matches/{id}', [MatchController::class, 'update']);
    Route::delete('matches/{id}', [MatchController::class, 'destroy']);

    // Match Events
    Route::get('matches/{matchId}/events', [MatchEventController::class, 'index']);
    Route::post('matches/{matchId}/events', [MatchEventController::class, 'store']);
    Route::delete('events/{id}', [MatchEventController::class, 'destroy']);

    // Statistics
    Route::get('matches/{matchId}/statistics', [StatisticsController::class, 'show']);

    // Video
    Route::get('matches/{matchId}/video', [VideoController::class, 'show']);
    Route::post('matches/{matchId}/video', [VideoController::class, 'store']);

    // Tactics
    Route::get('matches/{matchId}/tactics', [TacticController::class, 'index']);
    Route::post('matches/{matchId}/tactics', [TacticController::class, 'store']);
    Route::get('tactics/{id}', [TacticController::class, 'show']);
    Route::delete('tactics/{id}', [TacticController::class, 'destroy']);

    // Report PDF
    Route::get('matches/{matchId}/report', [ReportController::class, 'generate']);

    // AI Tracking
    Route::post('matches/{matchId}/tracking/queue', [TrackingController::class, 'queue']);
    Route::get('matches/{matchId}/tracking/status', [TrackingController::class, 'status']);
    Route::get('matches/{matchId}/tracking/players', [TrackingController::class, 'players']);
    Route::get('matches/{matchId}/tracking/ball', [TrackingController::class, 'ball']);
    Route::get('matches/{matchId}/tracking/heatmap', [TrackingController::class, 'heatmap']);
    Route::get('matches/{matchId}/tracking/summary', [TrackingController::class, 'summary']);
});
