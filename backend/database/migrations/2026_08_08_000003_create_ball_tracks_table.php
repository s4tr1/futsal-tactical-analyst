<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ball_tracks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');
            $table->integer('frame_number');
            $table->float('x');
            $table->float('y');
            $table->float('confidence')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->index(['match_id', 'frame_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ball_tracks');
    }
};
