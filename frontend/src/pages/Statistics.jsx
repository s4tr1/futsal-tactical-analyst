import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { BarChart3, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Statistics() {
  const [searchParams] = useSearchParams();
  const initialMatchId = searchParams.get('matchId') ? parseInt(searchParams.get('matchId')) : null;

  const [matchId, setMatchId] = useState(initialMatchId);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInitialMatches(); }, []);
  useEffect(() => { if (matchId) fetchMatchStats(); }, [matchId]);

  const fetchInitialMatches = async () => {
    try {
      const meRes = await api.get('/me');
      const teamId = meRes.data.data.team_id || meRes.data.data.owned_teams?.[0]?.id;
      if (!teamId) return;
      const res = await api.get(`/teams/${teamId}/matches`);
      const mList = res.data.data || [];
      setMatches(mList);
      if (mList.length > 0 && !matchId) setMatchId(mList[0].id);
    } catch (err) { console.error('Failed to fetch matches list:', err); }
  };

  const fetchMatchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/matches/${matchId}/statistics`);
      setStats(res.data.data);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-heading tracking-tight">Advanced Match Analytics</h1>
          <p className="text-sm text-secondary mt-1">Detailed performance breakdown &amp; telemetry stats</p>
        </div>
        <select value={matchId} onChange={(e) => setMatchId(parseInt(e.target.value))} className="input-dark text-xs w-auto min-w-[240px]">
          {matches.map((m) => (<option key={m.id} value={m.id}>#{m.id} vs {m.opponent_name} ({m.match_date || 'N/A'})</option>))}
        </select>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-muted">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4" />
          Calculating match statistics...
        </div>
      ) : !stats ? (
        <div className="glass-card p-12 text-center text-muted">No statistics telemetry recorded for this match yet.</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="stat-card">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Goals Scored</span>
              <div className="text-3xl font-extrabold text-heading mt-2">{stats.goals}</div>
              <div className="text-xs text-muted mt-1">Primary Scoring Event</div>
            </div>
            <div className="stat-card">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Shot Accuracy</span>
              <div className="text-3xl font-extrabold text-heading mt-2">{stats.shot_accuracy}%</div>
              <div className="text-xs text-muted mt-1">{stats.shots} total shot attempts</div>
            </div>
            <div className="stat-card">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Fouls Committed</span>
              <div className="text-3xl font-extrabold text-heading mt-2">{stats.fouls}</div>
              <div className="text-xs text-muted mt-1">Futsal 6-foul penalty limit</div>
            </div>
            <div className="stat-card">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Turnovers</span>
              <div className="text-3xl font-extrabold text-heading mt-2">{stats.turnovers}</div>
              <div className="text-xs text-muted mt-1">Unforced possession losses</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-heading uppercase tracking-wide flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" /> Player Goal &amp; Shot Output
              </h3>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.player_stats || []}>
                    <XAxis dataKey="name" stroke="#a89fc4" fontSize={11} />
                    <YAxis stroke="#a89fc4" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#17132e', borderColor: '#8b5cf6', borderRadius: '8px', color: '#ddd6fe' }} />
                    <Bar dataKey="goals" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Goals" />
                    <Bar dataKey="shots" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Shots" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-heading uppercase tracking-wide flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" /> Match Event Breakdown
              </h3>
              <div className="space-y-4 pt-2">
                {[
                  { label: 'Goals', value: stats.goals, color: 'bg-emerald-500', scale: 20 },
                  { label: 'Shots', value: stats.shots, color: 'bg-blue-500', scale: 15 },
                  { label: 'Fouls', value: stats.fouls, color: 'bg-amber-500', scale: 20 },
                  { label: 'Turnovers', value: stats.turnovers, color: 'bg-purple-500', scale: 15 },
                ].map(({ label, value, color, scale }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-secondary mb-1">
                      <span>{label} ({value})</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-fill ${color}`} style={{ width: `${Math.min(100, value * scale)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-heading uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Individual Player Box Score
            </h3>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Jersey</th>
                    <th>Player Name</th>
                    <th>Goals</th>
                    <th>Shots</th>
                    <th>Fouls</th>
                    <th>Turnovers</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.player_stats || []).map((p, idx) => (
                    <tr key={idx}>
                      <td className="font-mono font-bold text-purple-400">#{p.jersey}</td>
                      <td className="font-bold text-heading">{p.name}</td>
                      <td className="font-mono text-emerald-400 font-bold">{p.goals}</td>
                      <td className="font-mono text-blue-400">{p.shots}</td>
                      <td className="font-mono text-amber-400">{p.fouls}</td>
                      <td className="font-mono text-purple-300">{p.turnovers}</td>
                    </tr>
                  ))}
                  {(!stats.player_stats || stats.player_stats.length === 0) && (
                    <tr><td colSpan={6} className="text-center text-muted py-6">No individual player events logged for this match yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
