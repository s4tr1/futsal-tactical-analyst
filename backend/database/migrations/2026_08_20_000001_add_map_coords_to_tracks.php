<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_tracks', function (Blueprint $table) {
            $table->float('x_map')->nullable()->after('y');
            $table->float('y_map')->nullable()->after('x_map');
        });

        Schema::table('ball_tracks', function (Blueprint $table) {
            $table->float('x_map')->nullable()->after('y');
            $table->float('y_map')->nullable()->after('x_map');
        });
    }

    public function down(): void
    {
        Schema::table('player_tracks', function (Blueprint $table) {
            $table->dropColumn(['x_map', 'y_map']);
        });

        Schema::table('ball_tracks', function (Blueprint $table) {
            $table->dropColumn(['x_map', 'y_map']);
        });
    }
};
