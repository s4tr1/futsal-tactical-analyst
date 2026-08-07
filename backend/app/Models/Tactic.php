<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tactic extends Model
{
    use HasFactory;

    protected $fillable = ['match_id', 'name', 'canvas_json', 'created_by'];

    protected $casts = [
        'canvas_json' => 'array',
    ];

    public function match()
    {
        return $this->belongsTo(Matches::class, 'match_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
