<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('highlights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');
            $table->string('clip_path', 500);
            $table->integer('start_second')->nullable();
            $table->integer('end_second')->nullable();
            $table->string('event_type', 50)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['match_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('highlights');
    }
};
