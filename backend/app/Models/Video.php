<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    public $timestamps = false;
    protected $fillable = ['match_id', 'file_path', 'original_name', 'duration_seconds', 'file_size', 'uploaded_at'];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    public function match()
    {
        return $this->belongsTo(Matches::class, 'match_id');
    }
}
