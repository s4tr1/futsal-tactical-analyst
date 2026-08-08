<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_tracks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');
            $table->integer('frame_number');
            $table->integer('tracking_id');
            $table->float('x');
            $table->float('y');
            $table->float('confidence')->default(0);
            $table->enum('team', ['home', 'away', 'unknown'])->default('unknown');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['match_id', 'frame_number']);
            $table->index(['match_id', 'tracking_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_tracks');
    }
};
