<?php

namespace App\Services;

class TrackingAnalytics
{
    /**
     * Infer a playing role for each tracking_id from spatial statistics.
     *
     * @param array $playerTracks List of rows with keys:
     *                             tracking_id, team, frame_number, x, y, x_map, y_map.
     * @return array<int, string>  tracking_id => role (GK|DEF|MID|ATT|unknown).
     */
    public function inferRoles(array $playerTracks): array
    {
        $byId = [];
        foreach ($playerTracks as $row) {
            $byId[$row['tracking_id']][] = $row;
        }

        $teamById = [];
        $meanById = [];
        foreach ($byId as $tid => $rows) {
            $sumX = 0.0;
            $sumY = 0.0;
            $count = 0;
            $teamVotes = [];
            foreach ($rows as $row) {
                $sumX += $this->coord($row, 'x');
                $sumY += $this->coord($row, 'y');
                $count++;
                $team = $row['team'] ?? 'unknown';
                $teamVotes[$team] = ($teamVotes[$team] ?? 0) + 1;
            }
            $meanById[$tid] = ['x' => $sumX / max(1, $count), 'y' => $sumY / max(1, $count)];
            arsort($teamVotes);
            $teamById[$tid] = array_key_first($teamVotes);
        }

        $roles = [];

        // Goalkeeper: closest player of each team to their own goal line.
        // Convention (matches team classifier): home defends left (x=0),
        // away defends right (x=1).
        $goalXByTeam = ['home' => 0.0, 'away' => 1.0];
        foreach ($goalXByTeam as $team => $goalX) {
            $gk = null;
            $gkDist = null;
            foreach ($teamById as $tid => $t) {
                if ($t !== $team) {
                    continue;
                }
                $dist = abs($meanById[$tid]['x'] - $goalX);
                if ($gk === null || $dist < $gkDist) {
                    $gk = $tid;
                    $gkDist = $dist;
                }
            }
            if ($gk !== null) {
                $roles[$gk] = 'GK';
            }
        }

        // Outfield bands relative to attack direction:
        // home attacks right (ascending x), away attacks left (descending x).
        $orderByTeam = ['home' => 'asc', 'away' => 'desc'];
        foreach ($orderByTeam as $team => $order) {
            $outfield = [];
            foreach ($teamById as $tid => $t) {
                if ($t === $team && !isset($roles[$tid])) {
                    $outfield[] = $tid;
                }
            }

            usort($outfield, function ($a, $b) use ($meanById, $order) {
                $ax = $meanById[$a]['x'];
                $bx = $meanById[$b]['x'];
                return $order === 'asc' ? $ax <=> $bx : $bx <=> $ax;
            });

            $n = count($outfield);
            foreach ($outfield as $i => $tid) {
                $roles[$tid] = $this->outfieldBand($i, $n);
            }
        }

        // Players with unknown team stay unlabeled.
        foreach (array_keys($byId) as $tid) {
            if (!isset($roles[$tid])) {
                $roles[$tid] = 'unknown';
            }
        }

        return $roles;
    }

    /**
     * Predict the next heading position for every (tracking_id, frame_number)
     * using linear velocity extrapolation.
     *
     * @return array<int, array<int, array{x: float, y: float}|null>>
     *         tracking_id => frame_number => predicted point (map coords).
     */
    public function predictPositions(array $playerTracks, int $lookback = 3, int $horizon = 2): array
    {
        $byId = [];
        foreach ($playerTracks as $row) {
            $byId[$row['tracking_id']][] = $row;
        }

        $result = [];
        foreach ($byId as $tid => $rows) {
            usort($rows, fn ($a, $b) => $a['frame_number'] <=> $b['frame_number']);
            $result[$tid] = [];

            $n = count($rows);
            for ($i = 0; $i < $n; $i++) {
                $frame = $rows[$i]['frame_number'];
                $result[$tid][$frame] = null;

                $start = max(0, $i - $lookback);
                $steps = $i - $start;
                if ($steps < 1) {
                    continue;
                }

                $dx = $this->coord($rows[$i], 'x') - $this->coord($rows[$start], 'x');
                $dy = $this->coord($rows[$i], 'y') - $this->coord($rows[$start], 'y');

                $px = $this->coord($rows[$i], 'x') + ($dx / $steps) * $horizon;
                $py = $this->coord($rows[$i], 'y') + ($dy / $steps) * $horizon;

                $result[$tid][$frame] = ['x' => $px, 'y' => $py];
            }
        }

        return $result;
    }

    private function coord(array $row, string $axis): float
    {
        $mapped = $row[$axis . '_map'] ?? null;
        if ($mapped !== null && $mapped !== '') {
            return (float) $mapped;
        }

        return (float) ($row[$axis] ?? 0.0);
    }

    private function outfieldBand(int $index, int $total): string
    {
        if ($total <= 2) {
            return $index === 0 ? 'DEF' : 'ATT';
        }

        $third = $total / 3;
        if ($index < $third) {
            return 'DEF';
        }
        if ($index >= $total - $third) {
            return 'ATT';
        }

        return 'MID';
    }
}
