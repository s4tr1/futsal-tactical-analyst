<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Highlight extends Model
{
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'match_id', 'clip_path', 'start_second', 'end_second', 'event_type',
    ];

    protected $casts = [
        'start_second' => 'integer',
        'end_second' => 'integer',
    ];

    public function match()
    {
        return $this->belongsTo(Matches::class, 'match_id');
    }
}
