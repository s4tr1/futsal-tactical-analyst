<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Matches extends Model
{
    use HasFactory;

    protected $table = 'matches';

    protected $fillable = [
        'team_id', 'opponent_name', 'match_date', 'location',
        'competition', 'status', 'score_team', 'score_opponent',
    ];

    protected $casts = [
        'match_date' => 'date',
        'score_team' => 'integer',
        'score_opponent' => 'integer',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function events()
    {
        return $this->hasMany(MatchEvent::class, 'match_id')->orderBy('half')->orderBy('minute')->orderBy('second');
    }

    public function video()
    {
        return $this->hasOne(Video::class, 'match_id');
    }

    public function tactics()
    {
        return $this->hasMany(Tactic::class, 'match_id');
    }

    public function getResultAttribute(): string
    {
        if ($this->status !== 'finished') return 'pending';
        if ($this->score_team > $this->score_opponent) return 'victory';
        if ($this->score_team < $this->score_opponent) return 'defeat';
        return 'draw';
    }
}
