import { useEffect, useState } from 'react';
import api from '../api';
import { Film, Download, Play, Clapperboard, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Highlights() {
  const [matches, setMatches] = useState([]);
  const [matchId, setMatchId] = useState(null);
  const [highlights, setHighlights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchMatches(); }, []);
  useEffect(() => { if (matchId) fetchHighlights(); }, [matchId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const meRes = await api.get('/me');
      const teamId = meRes.data.data.team_id || meRes.data.data.owned_teams?.[0]?.id;
      if (!teamId) return;
      const res = await api.get(`/teams/${teamId}/matches`);
      const mList = res.data.data || [];
      setMatches(mList);
      if (mList.length > 0) setMatchId(mList[0].id);
    } finally { setLoading(false); }
  };

  const fetchHighlights = async () => {
    try { const res = await api.get(`/matches/${matchId}/highlights`); setHighlights(res.data.data); }
    catch { setHighlights(null); }
  };

  const handleGenerate = async () => {
    if (!matchId) return;
    setGenerating(true);
    setMsg('');
    try {
      const res = await api.post(`/matches/${matchId}/highlights/generate`);
      setMsg(res.data.message || 'Highlight generation started.');
      setTimeout(() => fetchHighlights(), 5000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gagal generate highlights.');
    } finally { setGenerating(false); }
  };

  const handleDownload = async (highlightId) => {
    try {
      const res = await api.get(`/highlights/${highlightId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = res.headers['content-disposition']?.match(/filename="?(.+?)"?$/)?.[1] || 'highlight.mp4';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Gagal mendownload highlight.'); }
  };

  const formatTime = (sec) => {
    if (!sec) return '--';
    const m = Math.floor(sec / 60);
    return `${m.toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
  };

  const selectedMatch = matches.find(m => m.id == matchId);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading tracking-tight">Match Highlights</h1>
          <p className="text-sm text-secondary mt-1">Auto-generated video clips from AI-detected &amp; manually-tagged events</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={matchId || ''} onChange={(e) => setMatchId(parseInt(e.target.value))} className="input-dark text-xs w-auto min-w-[220px]">
            {matches.map((m) => (<option key={m.id} value={m.id}>#{m.id} vs {m.opponent_name} ({m.status})</option>))}
          </select>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary text-xs py-2 px-4 gap-2">
            {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate</>}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          msg.toLowerCase().includes('gagal') ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
        }`}>
          {msg.toLowerCase().includes('gagal') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {msg}
        </div>
      )}

      {loading ? (
        <div className="glass-card p-12 text-center text-muted">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" /> Loading highlights...
        </div>
      ) : !highlights || (highlights.clips?.length === 0 && !highlights.reel) ? (
        <div className="glass-card p-12 text-center space-y-4">
          <Clapperboard className="w-16 h-16 text-purple-400/30 mx-auto" />
          <h3 className="text-lg font-bold text-heading">No Highlights Yet</h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            {selectedMatch?.video ? 'Run AI tracking first to auto-detect events, or manually tag events in Live Tagging, then click Generate.' : 'Upload a match video first, then run AI tracking to auto-detect key moments.'}
          </p>
          {!selectedMatch?.video && <p className="text-xs text-amber-400/80">Video not uploaded for this match.</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {highlights.reel && (
            <div className="glass-card p-6 bg-gradient-to-r from-amber-950/30 to-purple-950/30 border-amber-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                    <Clapperboard className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-heading text-base">Full Highlight Reel</h3>
                    <p className="text-xs text-muted">All clips combined into one video</p>
                  </div>
                </div>
                <button onClick={() => handleDownload(highlights.reel.id)} className="btn-primary text-xs py-2.5 px-5 gap-2">
                  <Download className="w-4 h-4" /> Download Reel
                </button>
              </div>
            </div>
          )}

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-heading uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" /> Individual Clips ({highlights.total || 0})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highlights.clips?.map((clip) => (
                <div key={clip.id} className="p-4 rounded-xl bg-black/20 border border-purple-500/10 hover:border-purple-500/30 transition-all space-y-3">
                  <div className="flex items-start justify-between">
                    <span className={`badge badge-${clip.event_type || 'victory'}`}>{clip.event_type?.toUpperCase() || 'EVENT'}</span>
                    <button onClick={() => handleDownload(clip.id)} className="text-purple-400 hover:text-heading p-1 transition-colors" title="Download clip">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <div className="text-xs text-secondary font-mono">{formatTime(clip.start_second)} — {formatTime(clip.end_second)}</div>
                    <div className="text-[10px] text-muted font-mono mt-0.5">Duration: {clip.end_second - clip.start_second}s</div>
                  </div>
                  <button onClick={() => handleDownload(clip.id)}
                    className="w-full py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-xs font-bold text-purple-300 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2">
                    <Play className="w-3.5 h-3.5" /> Download Clip
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
