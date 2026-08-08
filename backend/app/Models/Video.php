<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'match_id', 'file_path', 'original_name', 'duration_seconds', 'file_size', 'uploaded_at',
        'tracking_status', 'tracking_error', 'tracking_started_at', 'tracking_finished_at',
        'total_frames_processed', 'fps_source',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
        'tracking_started_at' => 'datetime',
        'tracking_finished_at' => 'datetime',
        'total_frames_processed' => 'integer',
        'fps_source' => 'float',
    ];

    public function match()
    {
        return $this->belongsTo(Matches::class, 'match_id');
    }
}
