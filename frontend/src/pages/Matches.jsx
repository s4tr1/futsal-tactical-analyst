import { useEffect, useState } from 'react';
import api from '../api';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Calendar, MapPin, Trophy, Play } from 'lucide-react';

export default function Matches() {
  const [searchParams] = useSearchParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [formData, setFormData] = useState({
    opponent_name: '',
    match_date: new Date().toISOString().split('T')[0],
    location: 'GOR Serbaguna',
    competition: 'National League',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchMatches();
    if (searchParams.get('newMatch') === '1') setShowModal(true);
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const meRes = await api.get('/me');
      const teamId = meRes.data.data.team_id || meRes.data.data.owned_teams?.[0]?.id;
      if (!teamId) return;
      const res = await api.get(`/teams/${teamId}/matches`);
      setMatches(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    try {
      const meRes = await api.get('/me');
      const teamId = meRes.data.data.team_id || meRes.data.data.owned_teams?.[0]?.id;
      if (!teamId) return;
      await api.post(`/teams/${teamId}/matches`, formData);
      setShowModal(false);
      fetchMatches();
      setFormData({ opponent_name: '', match_date: new Date().toISOString().split('T')[0], location: 'GOR Serbaguna', competition: 'National League', status: 'scheduled' });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambahkan pertandingan.');
    }
  };

  const filteredMatches = matches.filter(m => {
    if (activeTab === 'upcoming') return m.status === 'scheduled';
    if (activeTab === 'finished') return m.status === 'finished';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading tracking-tight">Match Registry</h1>
          <p className="text-sm text-secondary mt-1">Manage fixtures, line-ups, and live match tags</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Schedule New Match
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-purple-500/20 pb-3">
        {['all', 'upcoming', 'finished'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === tab ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-muted hover:text-secondary'
            }`}>
            {tab} Fixtures
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-muted">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4" />
          Loading match database...
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted">
          No matches found for filter: <span className="uppercase font-semibold">{activeTab}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => (
            <div key={match.id} className="glass-card p-6 space-y-5 flex flex-col justify-between hover:border-purple-500/50 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted font-mono font-medium">#{match.id}</span>
                  <span className={`badge badge-${match.status === 'finished' ? (match.score_team > match.score_opponent ? 'victory' : match.score_team < match.score_opponent ? 'defeat' : 'draw') : match.status}`}>
                    {match.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-center py-2 bg-black/20 rounded-xl p-3 border border-purple-500/10">
                  <div>
                    <div className="font-bold text-heading text-base">{match.team?.name || 'Home'}</div>
                    <div className="text-xs text-muted font-medium">Home</div>
                  </div>
                  <div className="text-2xl font-black text-purple-400 px-4">
                    {match.status === 'finished' ? `${match.score_team} - ${match.score_opponent}` : 'VS'}
                  </div>
                  <div>
                    <div className="font-bold text-primary text-base">{match.opponent_name}</div>
                    <div className="text-xs text-muted font-medium">Away</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-secondary">
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-purple-400" /><span>{match.match_date ? new Date(match.match_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD'}</span></div>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-purple-400" /><span>{match.location || 'GOR Serbaguna'}</span></div>
                  <div className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-purple-400" /><span>{match.competition || 'Friendly Match'}</span></div>
                </div>
              </div>

              <div className="pt-4 border-t border-purple-500/10 flex items-center justify-between gap-3">
                <Link to={`/live-tagging/${match.id}`} className="btn-primary text-xs py-2 flex-1 justify-center">
                  <Play className="w-3.5 h-3.5" /> Tag Match
                </Link>
                <Link to={`/statistics?matchId=${match.id}`} className="btn-secondary text-xs py-2">Stats</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="text-xl font-bold text-heading mb-4">Schedule New Fixture</h2>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div>
                <label>Opponent Team Name</label>
                <input type="text" required placeholder="e.g. Metro FC" value={formData.opponent_name} onChange={(e) => setFormData({ ...formData, opponent_name: e.target.value })} className="input-dark" />
              </div>
              <div>
                <label>Match Date</label>
                <input type="date" required value={formData.match_date} onChange={(e) => setFormData({ ...formData, match_date: e.target.value })} className="input-dark" />
              </div>
              <div>
                <label>Location / Arena</label>
                <input type="text" placeholder="GOR Serbaguna, Lapangan 1" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-dark" />
              </div>
              <div>
                <label>Competition</label>
                <input type="text" placeholder="National League" value={formData.competition} onChange={(e) => setFormData({ ...formData, competition: e.target.value })} className="input-dark" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-purple-500/20">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Fixture</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
