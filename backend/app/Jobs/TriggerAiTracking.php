<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TriggerAiTracking implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private int $matchId,
        private string $videoPath,
    ) {}

    public function handle(): void
    {
        Log::info("TriggerAiTracking: dispatching match {$this->matchId}, video: {$this->videoPath}");

        $response = Http::timeout(10)->post('http://127.0.0.1:8001/process', [
            'match_id' => $this->matchId,
            'video_path' => $this->videoPath,
        ]);

        if ($response->failed()) {
            Log::error("TriggerAiTracking: AI worker returned error for match {$this->matchId}: {$response->status()}");
        } else {
            Log::info("TriggerAiTracking: AI worker accepted match {$this->matchId}");
        }
    }
}
