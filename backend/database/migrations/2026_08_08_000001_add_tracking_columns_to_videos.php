<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->enum('tracking_status', ['none', 'queued', 'processing', 'done', 'failed'])->default('none')->after('uploaded_at');
            $table->text('tracking_error')->nullable()->after('tracking_status');
            $table->timestamp('tracking_started_at')->nullable()->after('tracking_error');
            $table->timestamp('tracking_finished_at')->nullable()->after('tracking_started_at');
            $table->integer('total_frames_processed')->default(0)->after('tracking_finished_at');
            $table->float('fps_source')->nullable()->after('total_frames_processed');
        });
    }

    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn([
                'tracking_status',
                'tracking_error',
                'tracking_started_at',
                'tracking_finished_at',
                'total_frames_processed',
                'fps_source',
            ]);
        });
    }
};
