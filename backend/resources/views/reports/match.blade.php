<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Match Report #{{ $match->id }}</title>
<style>
  body { font-family: DejaVu Sans, sans-serif; background: #fff; color: #222; margin: 0; padding: 24px; font-size: 12px; }
  .header { text-align: center; margin-bottom: 24px; border-bottom: 3px solid #7c3aed; padding-bottom: 16px; }
  .header h1 { font-size: 24px; color: #7c3aed; margin: 0; }
  .header h2 { font-size: 16px; margin: 6px 0 0; color: #444; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 14px; font-weight: bold; color: #7c3aed; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }
  .score-box { display: flex; justify-content: center; gap: 40px; background: #f3f0ff; padding: 16px; border-radius: 8px; text-align: center; }
  .score-team { font-size: 36px; font-weight: bold; color: #7c3aed; }
  .score-label { font-size: 11px; color: #666; margin-top: 4px; }
  .vs { font-size: 20px; color: #999; align-self: center; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #7c3aed; color: #fff; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }
  tr:nth-child(even) td { background: #f9f7ff; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
  .badge-goal { background: #dcfce7; color: #16a34a; }
  .badge-shot { background: #dbeafe; color: #1d4ed8; }
  .badge-foul { background: #fef9c3; color: #ca8a04; }
  .badge-turnover { background: #fce7f3; color: #be185d; }
  .stats-grid { display: flex; gap: 12px; flex-wrap: wrap; }
  .stat-card { flex: 1; min-width: 100px; background: #f9f7ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 10px; text-align: center; }
  .stat-value { font-size: 20px; font-weight: bold; color: #7c3aed; }
  .stat-label { font-size: 10px; color: #888; text-transform: uppercase; margin-top: 2px; }
  .footer { text-align: center; color: #aaa; font-size: 10px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style>
</head>
<body>

<div class="header">
  <h1>Futsal Tactical Analyst Lite</h1>
  <h2>Match Report — {{ $match->team->name }} vs {{ $match->opponent_name }}</h2>
  <p>{{ $match->match_date->format('d M Y') }} &bull; {{ $match->location ?? '-' }} &bull; {{ $match->competition ?? '-' }}</p>
</div>

<div class="section">
  <div class="section-title">Skor Akhir</div>
  <div class="score-box">
    <div>
      <div class="score-team">{{ $match->score_team }}</div>
      <div class="score-label">{{ $match->team->name }}</div>
    </div>
    <div class="vs">VS</div>
    <div>
      <div class="score-team">{{ $match->score_opponent }}</div>
      <div class="score-label">{{ $match->opponent_name }}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Ringkasan Statistik</div>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">{{ $stats['goals'] }}</div>
      <div class="stat-label">Goals</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{{ $stats['shots'] }}</div>
      <div class="stat-label">Shots</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{{ $stats['shot_accuracy'] }}%</div>
      <div class="stat-label">Shot Accuracy</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{{ $stats['fouls'] }}</div>
      <div class="stat-label">Fouls</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{{ $stats['turnovers'] }}</div>
      <div class="stat-label">Turnovers</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Timeline Event</div>
  <table>
    <thead>
      <tr>
        <th>Babak</th>
        <th>Menit</th>
        <th>Pemain</th>
        <th>Event</th>
        <th>Catatan</th>
      </tr>
    </thead>
    <tbody>
      @foreach($events as $event)
      <tr>
        <td>{{ $event->half }}</td>
        <td>{{ $event->minute }}'{{ $event->second > 0 ? ':'.$event->second : '' }}</td>
        <td>{{ $event->player ? '#'.$event->player->jersey_number.' '.$event->player->name : '-' }}</td>
        <td><span class="badge badge-{{ $event->event_type }}">{{ strtoupper($event->event_type) }}</span></td>
        <td>{{ $event->notes ?? '-' }}</td>
      </tr>
      @endforeach
      @if($events->isEmpty())
      <tr><td colspan="5" style="text-align:center; color:#aaa;">Belum ada event tercatat.</td></tr>
      @endif
    </tbody>
  </table>
</div>

<div class="footer">
  Futsal Tactical Analyst Lite &bull; Elite Tactical Suite &bull; Laporan digenerate otomatis
</div>

</body>
</html>
