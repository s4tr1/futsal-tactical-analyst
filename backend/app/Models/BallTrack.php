<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BallTrack extends Model
{
    public $timestamps = false;
    protected $fillable = ['match_id', 'frame_number', 'x', 'y', 'confidence'];

    protected $casts = [
        'x' => 'float',
        'y' => 'float',
        'confidence' => 'float',
        'frame_number' => 'integer',
    ];

    public function match()
    {
        return $this->belongsTo(Matches::class, 'match_id');
    }
}
