import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Target, Activity, Plus, Crosshair, FileText, ArrowUpRight, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [lastStats, setLastStats] = useState(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const meRes = await api.get('/me');
      const userData = meRes.data.data;
      setTeam(userData.team);

      if (userData.team_id || (userData.owned_teams && userData.owned_teams.length > 0)) {
        const teamId = userData.team_id || userData.owned_teams[0].id;
        const matchesRes = await api.get(`/teams/${teamId}/matches`);
        const mList = matchesRes.data.data || [];
        setMatches(mList);

        const lastFinished = mList.find(m => m.status === 'finished');
        if (lastFinished) {
          try {
            const statsRes = await api.get(`/matches/${lastFinished.id}/statistics`);
            setLastStats(statsRes.data.data);
          } catch { }
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const finishedMatches = matches.filter(m => m.status === 'finished');
  const wins = finishedMatches.filter(m => m.result === 'victory' || m.score_team > m.score_opponent).length;
  const winRate = finishedMatches.length > 0 ? Math.round((wins / finishedMatches.length) * 100) : 0;

  const totalGoals = finishedMatches.reduce((acc, m) => acc + (m.score_team || 0), 0);
  const avgGoals = finishedMatches.length > 0 ? (totalGoals / finishedMatches.length).toFixed(1) : '0.0';

  const liveMatch = matches.find(m => m.status === 'live');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-heading tracking-tight">
            Welcome Back, <span className="text-accent-strong">{user?.name || 'Coach'}</span>
          </h1>
          <p className="text-sm text-secondary mt-1">
            Tactical Overview for <span className="font-semibold text-primary">{team?.name || ''}</span>
          </p>
        </div>

        {liveMatch && (
          <Link
            to={`/live-tagging/${liveMatch.id}`}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/40 hover:border-red-500/80 p-3 px-5 rounded-xl text-red-400 font-semibold text-sm transition-all animate-glow"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>ACTIVE MATCH: vs {liveMatch.opponent_name}</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="stat-card-label">Win Rate</span>
            <div className="stat-card-icon flex items-center justify-center">
              <Trophy className="w-4 h-4 text-accent-strong" />
            </div>
          </div>
          <div>
            <div className="stat-card-value">{winRate}%</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{wins} W in {finishedMatches.length} matches</span>
            </div>
          </div>
        </div>

        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="stat-card-label">Goals / Match</span>
            <div className="stat-card-icon flex items-center justify-center">
              <Target className="w-4 h-4 text-accent-strong" />
            </div>
          </div>
          <div>
            <div className="stat-card-value">{avgGoals}</div>
            <div className="text-xs text-purple-300/60 mt-2">{totalGoals} total goals scored</div>
          </div>
        </div>

        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="stat-card-label">Ball Control Index</span>
            <div className="stat-card-icon flex items-center justify-center">
              <Activity className="w-4 h-4 text-accent-strong" />
            </div>
          </div>
          <div>
            <div className="stat-card-value">{lastStats ? `${lastStats.ball_control_index}%` : '--'}</div>
            <div className="text-xs text-purple-300/60 mt-2">
              {lastStats ? 'Estimated ball control rating' : 'No finished match data yet'}
            </div>
          </div>
        </div>

        <div className="stat-card !border-dashed !border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 cursor-pointer" onClick={() => navigate('/matches')}>
          <div className="flex items-center justify-between">
            <span className="stat-card-label">Quick Match Prep</span>
            <Plus className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-purple-200">New Fixture</div>
            <p className="text-xs text-purple-300/50 mt-1">Schedule and prepare tactics</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-heading flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" /> Recent Fixtures &amp; Results
            </h2>
            <Link to="/matches" className="text-xs font-semibold text-accent-strong hover:text-purple-300 transition-colors">
              View All Registry &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="glass-card p-12 text-center text-purple-400/60">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4" />
              Loading fixtures data...
            </div>
          ) : matches.length === 0 ? (
            <div className="glass-card p-12 text-center text-purple-300/60">
              No matches found. Create your first fixture!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.slice(0, 4).map((match) => (
                <div key={match.id} className="glass-card p-5 space-y-4 hover:border-purple-500/50 transition-all">
                  <div className="flex items-center justify-between text-xs text-purple-300/60 font-mono">
                    <span>{match.match_date ? new Date(match.match_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}</span>
                    <span className={`badge badge-${match.status === 'finished' ? (match.score_team > match.score_opponent ? 'victory' : match.score_team < match.score_opponent ? 'defeat' : 'draw') : match.status}`}>
                      {match.status === 'finished' ? (match.score_team > match.score_opponent ? 'VICTORY' : match.score_team < match.score_opponent ? 'DEFEAT' : 'DRAW') : match.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="font-bold text-heading text-base">{team?.name || ''}</div>
                    <div className="text-xl font-black text-accent-strong px-3">
                      {match.status === 'finished' ? `${match.score_team} - ${match.score_opponent}` : 'VS'}
                    </div>
                    <div className="font-bold text-primary text-base">{match.opponent_name}</div>
                  </div>

                  <div className="text-xs text-purple-400/60 flex items-center justify-between border-t border-purple-500/10 pt-3">
                    <span>{match.competition || 'Friendly Match'}</span>
                    <Link to={`/live-tagging/${match.id}`} className="text-accent-strong hover:underline font-medium">
                      Analysis &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-heading">Quick Tactical Tools</h2>

          <div className="glass-card p-6 space-y-4">
            <Link
              to="/live-tagging"
              className="flex items-center gap-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-600/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="font-bold text-heading text-sm">Live Match Tagging</div>
                <div className="text-xs text-secondary">Real-time event recording &amp; telemetry</div>
              </div>
            </Link>

            <Link
              to="/tactical-board"
              className="flex items-center gap-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-600/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Crosshair className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="font-bold text-heading text-sm">Tactical Board</div>
                <div className="text-xs text-secondary">Interactive canvas &amp; play routine design</div>
              </div>
            </Link>

            <Link
              to="/reports"
              className="flex items-center gap-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-600/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="font-bold text-heading text-sm">Export Match PDF</div>
                <div className="text-xs text-secondary">Automated post-match executive report</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
