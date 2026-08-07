<?php

namespace Database\Seeders;

use App\Models\MatchEvent;
use App\Models\Matches;
use App\Models\Player;
use App\Models\Tactic;
use App\Models\Team;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // --- Coach -----------------------------------------------
        $coach = User::create([
            'name'     => 'Ahmad Ramadhan',
            'email'    => 'analyst@team.com',
            'password' => Hash::make('password'),
            'role'     => 'coach',
        ]);

        // --- Team ------------------------------------------------
        $team = Team::create([
            'name'     => 'City FC',
            'coach_id' => $coach->id,
        ]);

        // Update coach team_id
        $coach->update(['team_id' => $team->id]);

        // --- Players ---------------------------------------------
        $positions = ['Kiper', 'Flank', 'Flank', 'Pivot', 'Anchor', 'Flank', 'Pivot', 'Flank', 'Kiper', 'Anchor'];
        $names     = ['Ahmad Zaki', 'Budi Santoso', 'Cahyo Pratama', 'Deni Kurniawan', 'Eko Wijaya',
                      'Fajar Ramli', 'Galih Setiawan', 'Hendra Putra', 'Ilham Maulana', 'Joko Susilo'];

        $players = [];
        foreach ($names as $i => $name) {
            $players[] = Player::create([
                'team_id'       => $team->id,
                'name'          => $name,
                'jersey_number' => $i + 1,
                'position'      => $positions[$i],
            ]);
        }

        // --- Match 1: Finals vs Metro FC (finished, Win) ---------
        $match1 = Matches::create([
            'team_id'        => $team->id,
            'opponent_name'  => 'Metro FC',
            'match_date'     => '2023-10-12',
            'location'       => 'GOR Serbaguna, Lapangan 1',
            'competition'    => 'National League - Final',
            'status'         => 'finished',
            'score_team'     => 4,
            'score_opponent' => 2,
        ]);

        $events1 = [
            ['player_id' => $players[3]->id, 'event_type' => 'goal', 'half' => 1, 'minute' => 5, 'second' => 12, 'notes' => 'Gol jarak jauh'],
            ['player_id' => $players[2]->id, 'event_type' => 'shot', 'half' => 1, 'minute' => 8, 'second' => 0, 'notes' => null],
            ['player_id' => $players[1]->id, 'event_type' => 'foul', 'half' => 1, 'minute' => 11, 'second' => 30, 'notes' => null],
            ['player_id' => $players[5]->id, 'event_type' => 'goal', 'half' => 1, 'minute' => 14, 'second' => 22, 'notes' => 'Umpan terobosan Pivot'],
            ['player_id' => $players[9]->id, 'event_type' => 'turnover', 'half' => 2, 'minute' => 4, 'second' => 50, 'notes' => null],
            ['player_id' => $players[3]->id, 'event_type' => 'goal', 'half' => 2, 'minute' => 8, 'second' => 0, 'notes' => 'Header corner'],
            ['player_id' => $players[6]->id, 'event_type' => 'shot', 'half' => 2, 'minute' => 12, 'second' => 15, 'notes' => null],
            ['player_id' => $players[4]->id, 'event_type' => 'goal', 'half' => 2, 'minute' => 18, 'second' => 44, 'notes' => 'Penalti'],
        ];

        foreach ($events1 as $evt) {
            MatchEvent::create(array_merge($evt, ['match_id' => $match1->id]));
        }

        // --- Match 2: vs Dynamo Rovers (finished, Draw) ----------
        $match2 = Matches::create([
            'team_id'        => $team->id,
            'opponent_name'  => 'Dynamo Rovers',
            'match_date'     => '2023-10-08',
            'location'       => 'Arena Krida',
            'competition'    => 'National League',
            'status'         => 'finished',
            'score_team'     => 1,
            'score_opponent' => 1,
        ]);

        $events2 = [
            ['player_id' => $players[5]->id, 'event_type' => 'goal',    'half' => 1, 'minute' => 9,  'second' => 0,  'notes' => null],
            ['player_id' => $players[2]->id, 'event_type' => 'foul',    'half' => 1, 'minute' => 15, 'second' => 30, 'notes' => null],
            ['player_id' => $players[8]->id, 'event_type' => 'turnover','half' => 2, 'minute' => 7,  'second' => 0,  'notes' => null],
            ['player_id' => $players[4]->id, 'event_type' => 'shot',    'half' => 2, 'minute' => 17, 'second' => 22, 'notes' => null],
        ];
        foreach ($events2 as $evt) {
            MatchEvent::create(array_merge($evt, ['match_id' => $match2->id]));
        }

        // --- Match 3: vs Spartans (scheduled) --------------------
        Matches::create([
            'team_id'        => $team->id,
            'opponent_name'  => 'Spartans FC',
            'match_date'     => now()->addDays(14)->toDateString(),
            'location'       => 'GOR Serbaguna, Lapangan 1',
            'competition'    => 'National League',
            'status'         => 'scheduled',
        ]);

        // --- Tactics for Match 1 ---------------------------------
        Tactic::create([
            'match_id'   => $match1->id,
            'name'       => 'Corner Routine 1',
            'canvas_json'=> [
                'tokens' => [
                    ['id' => 'a1', 'team' => 'A', 'number' => 9,  'x' => 120, 'y' => 280, 'color' => '#a855f7'],
                    ['id' => 'a2', 'team' => 'A', 'number' => 5,  'x' => 200, 'y' => 350, 'color' => '#a855f7'],
                    ['id' => 'a3', 'team' => 'A', 'number' => 10, 'x' => 300, 'y' => 400, 'color' => '#a855f7'],
                ],
                'arrows' => [
                    ['from' => ['x' => 120, 'y' => 280], 'to' => ['x' => 200, 'y' => 350]],
                ],
            ],
            'created_by' => $coach->id,
        ]);

        Tactic::create([
            'match_id'   => $match1->id,
            'name'       => 'High Press Def',
            'canvas_json'=> [
                'tokens' => [
                    ['id' => 'a1', 'team' => 'A', 'number' => 1,  'x' => 600, 'y' => 300, 'color' => '#a855f7'],
                    ['id' => 'a2', 'team' => 'A', 'number' => 3,  'x' => 450, 'y' => 220, 'color' => '#a855f7'],
                    ['id' => 'a3', 'team' => 'A', 'number' => 4,  'x' => 450, 'y' => 380, 'color' => '#a855f7'],
                ],
                'arrows' => [],
            ],
            'created_by' => $coach->id,
        ]);

        $this->command->info('? Seeder selesai! Login: analyst@team.com / password');
    }
}

