<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerTrack extends Model
{
    public $timestamps = false;
    protected $fillable = ['match_id', 'frame_number', 'tracking_id', 'x', 'y', 'confidence', 'team'];

    protected $casts = [
        'x' => 'float',
        'y' => 'float',
        'confidence' => 'float',
        'frame_number' => 'integer',
        'tracking_id' => 'integer',
    ];

    public function match()
    {
        return $this->belongsTo(Matches::class, 'match_id');
    }
}
