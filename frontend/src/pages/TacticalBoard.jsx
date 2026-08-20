import { useEffect, useState, useRef, useCallback } from 'react';
import { Save, Trash2, Move, ArrowRight, Circle, Type, Plus, Play, Pause, SkipBack, SkipForward, Camera, Loader2, Eye, Edit3 } from 'lucide-react';
import api from '../api';

const PITCH_W = 800;
const PITCH_H = 520;
const MARGIN = 30;

export default function TacticalBoard() {
  const [mode, setMode] = useState('edit');
  const [activeTool, setActiveTool] = useState('select');
  const [tacticName, setTacticName] = useState('Power Play Set 1');
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [tactics, setTactics] = useState([]);

  const [teamATokens, setTeamATokens] = useState([
    { id: 'a1', number: 1, x: 120, y: 260 },
    { id: 'a2', number: 5, x: 280, y: 160 },
    { id: 'a3', number: 8, x: 280, y: 360 },
    { id: 'a4', number: 10, x: 400, y: 260 },
  ]);
  const [teamBTokens, setTeamBTokens] = useState([
    { id: 'b1', number: 1, x: 680, y: 260 },
    { id: 'b2', number: 2, x: 520, y: 180 },
    { id: 'b3', number: 3, x: 520, y: 340 },
  ]);
  const [ballPos, setBallPos] = useState(null);

  const [draggedToken, setDraggedToken] = useState(null);
  const [arrows, setArrows] = useState([]);
  const [zones, setZones] = useState([]);
  const [texts, setTexts] = useState([]);
  const [drawStart, setDrawStart] = useState(null);
  const [textPrompt, setTextPrompt] = useState(null);

  const [playbackData, setPlaybackData] = useState(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [showPrediction, setShowPrediction] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [snapshotMsg, setSnapshotMsg] = useState('');

  const pitchRef = useRef(null);
  const svgRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const playbackIndexRef = useRef(0);

  useEffect(() => { fetchMatches(); }, []);
  useEffect(() => { if (selectedMatchId && mode === 'edit') fetchTactics(); }, [selectedMatchId, mode]);

  const fetchMatches = async () => {
    try {
      const meRes = await api.get('/me');
      const teamId = meRes.data.data.team_id || meRes.data.data.owned_teams?.[0]?.id;
      if (!teamId) return;
      const res = await api.get(`/teams/${teamId}/matches`);
      const mList = res.data.data || [];
      setMatches(mList);
      if (mList.length > 0 && !selectedMatchId) setSelectedMatchId(mList[0].id);
    } catch { }
  };

  const fetchTactics = async () => {
    try {
      const res = await api.get(`/matches/${selectedMatchId}/tactics`);
      setTactics(res.data.data || []);
    } catch (err) { console.error('Failed to fetch tactics:', err); }
  };

  const loadTactic = (tactic) => {
    setMode('edit');
    setTacticName(tactic.name);
    const json = typeof tactic.canvas_json === 'string' ? JSON.parse(tactic.canvas_json) : tactic.canvas_json;
    if (json.teamA) setTeamATokens(json.teamA);
    if (json.teamB) setTeamBTokens(json.teamB);
    if (json.arrows) setArrows(json.arrows);
    if (json.zones) setZones(json.zones);
    if (json.texts) setTexts(json.texts);
    setBallPos(json.ball || null);
  };

  const enterPlaybackMode = async () => {
    if (!selectedMatchId) { alert('Pilih pertandingan terlebih dahulu.'); return; }
    setMode('playback');
    setPlaybackLoading(true);
    setPlaybackIndex(0);
    setIsPlaying(false);
    try {
      const res = await api.get(`/matches/${selectedMatchId}/tracking/playback`);
      setPlaybackData(res.data.data);
    } catch {
      alert('Gagal memuat data tracking. Pastikan AI tracking sudah selesai.');
      setMode('edit');
    } finally { setPlaybackLoading(false); }
  };

  const exitPlaybackMode = () => {
    setIsPlaying(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setMode('edit');
    setPlaybackData(null);
    setPlaybackIndex(0);
    setSnapshotMsg('');
  };

  const applyPlaybackFrame = useCallback((index) => {
    if (!playbackData?.frames?.length) return;
    const frame = playbackData.frames[index];
    if (!frame) return;

    const homeTokens = [];
    const awayTokens = [];
    frame.players.forEach((p) => {
      const token = {
        id: `pb_${p.tracking_id}`,
        number: p.tracking_id,
        x: (p.x_map ?? p.x) * PITCH_W,
        y: (p.y_map ?? p.y) * PITCH_H,
        role: p.role || 'unknown',
        predicted: p.predicted ? { x: p.predicted.x * PITCH_W, y: p.predicted.y * PITCH_H } : null,
      };
      if (p.team === 'home') homeTokens.push(token);
      else awayTokens.push(token);
    });

    if (homeTokens.length === 0 && awayTokens.length > 0) {
      const mid = Math.floor(awayTokens.length / 2);
      setTeamATokens(awayTokens.slice(0, mid));
      setTeamBTokens(awayTokens.slice(mid));
    } else {
      setTeamATokens(homeTokens);
      setTeamBTokens(awayTokens);
    }

    setBallPos(frame.ball ? { x: (frame.ball.x_map ?? frame.ball.x) * PITCH_W, y: (frame.ball.y_map ?? frame.ball.y) * PITCH_H } : null);
    setPlaybackIndex(index);
    playbackIndexRef.current = index;
  }, [playbackData]);

  useEffect(() => {
    if (!playbackData?.frames?.length) return;
    if (isPlaying) {
      const fps = playbackData.fps / playbackData.sample_rate;
      const frameInterval = 1000 / fps / playSpeed;

      const animate = (timestamp) => {
        if (timestamp - lastFrameTimeRef.current >= frameInterval) {
          lastFrameTimeRef.current = timestamp;
          const nextIndex = playbackIndexRef.current + 1;
          if (nextIndex >= playbackData.frames.length) { setIsPlaying(false); return; }
          applyPlaybackFrame(nextIndex);
        }
        animFrameRef.current = requestAnimationFrame(animate);
      };
      lastFrameTimeRef.current = performance.now();
      animFrameRef.current = requestAnimationFrame(animate);
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying, playSpeed, playbackData, applyPlaybackFrame]);

  const handlePlayPause = () => {
    if (playbackIndex >= (playbackData?.frames?.length || 0) - 1) {
      setPlaybackIndex(0);
      playbackIndexRef.current = 0;
      if (playbackData?.frames?.length) applyPlaybackFrame(0);
    }
    setIsPlaying(prev => !prev);
  };

  const handleTimelineChange = (e) => { setIsPlaying(false); applyPlaybackFrame(parseInt(e.target.value)); };

  const handleSnapshot = async () => {
    if (!playbackData?.frames?.[playbackIndex]) return;
    const fn = playbackData.frames[playbackIndex].frame_number;
    const timestamp = playbackData.fps > 0 ? `${Math.floor(fn / playbackData.fps / 60)}m${Math.floor((fn / playbackData.fps) % 60)}s` : `F${fn}`;
    const name = `Auto-Schema #${selectedMatchId} ${timestamp}`;
    try {
      await api.post(`/matches/${selectedMatchId}/tracking/snapshot-to-tactic`, { frame_number: fn, name });
      setSnapshotMsg(`Saved: "${name}"`);
      setTimeout(() => setSnapshotMsg(''), 3000);
    } catch (err) { alert(err.response?.data?.message || 'Gagal menyimpan snapshot.'); }
  };

  const formatTimestamp = (fn) => {
    if (!playbackData?.fps) return `F${fn}`;
    const sec = fn / playbackData.fps;
    return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
  };

  const getSvgCoords = (e) => {
    const rect = pitchRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (PITCH_W / rect.width), y: (e.clientY - rect.top) * (PITCH_H / rect.height) };
  };

  const isOnToken = (mx, my) => {
    const all = [...teamATokens.map(t => ({ ...t, team: 'A' })), ...teamBTokens.map(t => ({ ...t, team: 'B' }))];
    return all.find(t => Math.hypot(t.x - mx, t.y - my) < 22);
  };

  const handlePitchMouseDown = (e) => {
    if (mode === 'playback') return;
    const coords = getSvgCoords(e);
    if (coords.x < MARGIN || coords.y < MARGIN || coords.x > PITCH_W - MARGIN || coords.y > PITCH_H - MARGIN) return;
    if (activeTool === 'select') { const token = isOnToken(coords.x, coords.y); if (token) setDraggedToken(token); return; }
    if (activeTool === 'arrow' || activeTool === 'zone') { setDrawStart(coords); return; }
    if (activeTool === 'text') setTextPrompt({ x: coords.x, y: coords.y });
  };

  const handlePitchMouseMove = (e) => {
    if (mode === 'playback' || !draggedToken) return;
    const coords = getSvgCoords(e);
    const x = Math.max(MARGIN, Math.min(PITCH_W - MARGIN, coords.x));
    const y = Math.max(MARGIN, Math.min(PITCH_H - MARGIN, coords.y));
    if (draggedToken.team === 'A') setTeamATokens(prev => prev.map(t => t.id === draggedToken.id ? { ...t, x, y } : t));
    else setTeamBTokens(prev => prev.map(t => t.id === draggedToken.id ? { ...t, x, y } : t));
  };

  const handlePitchMouseUp = (e) => {
    if (mode === 'playback') return;
    if (draggedToken) { setDraggedToken(null); return; }
    if (!drawStart) return;
    const coords = getSvgCoords(e);
    const cx = Math.max(MARGIN, Math.min(PITCH_W - MARGIN, coords.x));
    const cy = Math.max(MARGIN, Math.min(PITCH_H - MARGIN, coords.y));
    if (activeTool === 'arrow') {
      if (Math.hypot(cx - drawStart.x, cy - drawStart.y) > 8) setArrows([...arrows, { id: Date.now(), x1: drawStart.x, y1: drawStart.y, x2: cx, y2: cy }]);
      setDrawStart(null);
    }
    if (activeTool === 'zone') {
      const r = Math.hypot(cx - drawStart.x, cy - drawStart.y);
      if (r > 6) setZones([...zones, { id: Date.now(), cx: drawStart.x, cy: drawStart.y, r }]);
      setDrawStart(null);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    const val = e.target.text.value.trim();
    if (val && textPrompt) setTexts([...texts, { id: Date.now(), x: textPrompt.x, y: textPrompt.y, text: val }]);
    setTextPrompt(null);
  };

  const clearAll = () => { setTeamATokens([]); setTeamBTokens([]); setArrows([]); setZones([]); setTexts([]); setBallPos(null); };
  const addToken = (team) => {
    if (team === 'A') setTeamATokens([...teamATokens, { id: `a_${Date.now()}`, number: teamATokens.length + 1, x: 150, y: 260 }]);
    else setTeamBTokens([...teamBTokens, { id: `b_${Date.now()}`, number: teamBTokens.length + 1, x: 650, y: 260 }]);
  };

  const handleSaveTactic = async () => {
    if (!selectedMatchId) { alert('Pilih pertandingan terlebih dahulu.'); return; }
    try {
      await api.post(`/matches/${selectedMatchId}/tactics`, { name: tacticName, canvas_json: { teamA: teamATokens, teamB: teamBTokens, arrows, zones, texts, ball: ballPos } });
      alert('Taktik berhasil disimpan!');
      fetchTactics();
    } catch (err) { alert(err?.response?.data?.message || 'Gagal menyimpan taktik'); }
  };

  const handleDeleteTactic = async (id) => {
    try { await api.delete(`/tactics/${id}`); setTactics(prev => prev.filter(t => t.id !== id)); }
    catch { alert('Gagal menghapus taktik'); }
  };

  const arrowHead = (x1, y1, x2, y2, size = 8) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const x3 = x2 - size * Math.cos(angle - Math.PI / 6);
    const y3 = y2 - size * Math.sin(angle - Math.PI / 6);
    const x4 = x2 - size * Math.cos(angle + Math.PI / 6);
    const y4 = y2 - size * Math.sin(angle + Math.PI / 6);
    return `${x2},${y2} ${x3},${y3} ${x4},${y4}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-heading tracking-tight">Interactive Tactical Board</h1>
          <p className="text-sm text-secondary mt-1">
            {mode === 'playback' ? 'AI-powered playback — watch tracked player &amp; ball movement' : 'Design set-pieces, power play routines &amp; defensive formations'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={selectedMatchId || ''} onChange={(e) => setSelectedMatchId(parseInt(e.target.value))} className="input-dark text-xs py-2 w-48">
            <option value="" disabled>Pilih Pertandingan</option>
            {matches.map(m => (<option key={m.id} value={m.id}>vs {m.opponent_name} (#{m.id})</option>))}
          </select>

          {mode === 'edit' ? (
            <>
              <input type="text" value={tacticName} onChange={(e) => setTacticName(e.target.value)} className="input-dark text-xs py-2 w-44" placeholder="Tactic Routine Name" />
              <button onClick={handleSaveTactic} className="btn-primary text-xs py-2"><Save className="w-3.5 h-3.5" /> Save Routine</button>
              <button onClick={enterPlaybackMode} className="btn-secondary text-xs py-2 border-cyan-500/30 text-cyan-400 hover:border-cyan-500/60">
                <Eye className="w-3.5 h-3.5" /> Playback
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSnapshot} className="btn-primary text-xs py-2">
                <Camera className="w-3.5 h-3.5" /> Snapshot Schema
              </button>
              <button onClick={exitPlaybackMode} className="btn-secondary text-xs py-2 border-amber-500/30 text-amber-400 hover:border-amber-500/60">
                <Edit3 className="w-3.5 h-3.5" /> Edit Mode
              </button>
            </>
          )}
        </div>
      </div>

      {snapshotMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Camera className="w-3.5 h-3.5" /> {snapshotMsg}
        </div>
      )}

      {mode === 'playback' && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={handlePlayPause} className="btn-primary text-xs py-2 px-4 gap-2">
              {isPlaying ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Play</>}
            </button>
            <button onClick={() => { setIsPlaying(false); applyPlaybackFrame(0); }} className="btn-secondary text-xs py-2 px-3" title="Restart"><SkipBack className="w-4 h-4" /></button>
            <button onClick={() => { setIsPlaying(false); if (playbackData?.frames?.length) applyPlaybackFrame(playbackData.frames.length - 1); }} className="btn-secondary text-xs py-2 px-3" title="End"><SkipForward className="w-4 h-4" /></button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-purple-400 font-mono w-16 text-right">
                {playbackData?.frames?.[playbackIndex] ? formatTimestamp(playbackData.frames[playbackIndex].frame_number) : '--:--'}
              </span>
              <input type="range" min={0} max={(playbackData?.frames?.length || 1) - 1} value={playbackIndex} onChange={handleTimelineChange}
                className="flex-1 min-w-[200px] h-2 rounded-lg appearance-none bg-purple-900/30 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:cursor-pointer" />
              <span className="text-purple-400 font-mono w-16">
                {playbackData?.frames?.length ? formatTimestamp(playbackData.frames[playbackData.frames.length - 1].frame_number) : '--:--'}
              </span>
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[10px] text-muted mr-1">Speed:</span>
              {[0.5, 1, 2, 4].map(s => (
                <button key={s} onClick={() => setPlaySpeed(s)}
                  className={`text-[10px] px-2 py-1 rounded font-mono font-bold transition-all ${playSpeed === s ? 'bg-purple-500 text-heading' : 'bg-purple-900/30 text-purple-400 hover:bg-purple-800/40'}`}>
                  {s}x
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setShowPrediction(p => !p)}
                className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${showPrediction ? 'bg-amber-500 text-heading' : 'bg-purple-900/30 text-purple-400 hover:bg-purple-800/40'}`}>
                Prediction {showPrediction ? 'ON' : 'OFF'}
              </button>
              <button onClick={() => setShowLabels(p => !p)}
                className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${showLabels ? 'bg-cyan-500 text-heading' : 'bg-purple-900/30 text-purple-400 hover:bg-purple-800/40'}`}>
                Labels {showLabels ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted">
            <span>Frame {playbackData?.frames?.[playbackIndex]?.frame_number ?? '--'}</span>
            <span>{playbackData?.frame_count ?? 0} frames | sampled every {playbackData?.sample_rate ?? 5} frames | ~{playbackData?.fps ?? 30} fps</span>
          </div>
        </div>
      )}

      {playbackLoading && (
        <div className="glass-card p-12 text-center text-muted">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          Loading tracking playback data...
        </div>
      )}

      {(!playbackLoading || mode === 'edit') && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div ref={pitchRef} className="relative w-full bg-[#0d1a10] border-2 border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl select-none"
              style={{ aspectRatio: `${PITCH_W}/${PITCH_H}`, cursor: mode === 'playback' ? 'default' : 'crosshair' }}
              onMouseDown={handlePitchMouseDown} onMouseMove={handlePitchMouseMove} onMouseUp={handlePitchMouseUp}>
              <svg ref={svgRef} viewBox={`0 0 ${PITCH_W} ${PITCH_H}`} className="absolute inset-0 w-full h-full pointer-events-none">
                <rect x={MARGIN} y={MARGIN} width={PITCH_W - MARGIN * 2} height={PITCH_H - MARGIN * 2} rx="8" stroke="rgba(168,85,247,0.3)" fill="none" strokeWidth="1.5" />
                <line x1={PITCH_W / 2} y1={MARGIN} x2={PITCH_W / 2} y2={PITCH_H - MARGIN} stroke="rgba(168,85,247,0.3)" strokeWidth="1.5" />
                <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r="60" stroke="rgba(168,85,247,0.3)" fill="none" strokeWidth="1.5" />
                <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r="3" fill="rgba(168,85,247,0.5)" />
                <path d={`M ${MARGIN} ${PITCH_H / 2 - 70} A 90 90 0 0 1 ${MARGIN + 90} ${PITCH_H / 2} A 90 90 0 0 1 ${MARGIN} ${PITCH_H / 2 + 70}`} stroke="rgba(168, 85, 247, 0.5)" fill="none" strokeWidth="1.5" />
                <path d={`M ${PITCH_W - MARGIN} ${PITCH_H / 2 - 70} A 90 90 0 0 0 ${PITCH_W - MARGIN - 90} ${PITCH_H / 2} A 90 90 0 0 0 ${PITCH_W - MARGIN} ${PITCH_H / 2 + 70}`} stroke="rgba(168, 85, 247, 0.5)" fill="none" strokeWidth="1.5" />
                <circle cx={MARGIN + 70} cy={PITCH_H / 2} r="3" fill="rgba(168,85,247,0.5)" />
                <circle cx={PITCH_W - MARGIN - 70} cy={PITCH_H / 2} r="3" fill="rgba(168,85,247,0.5)" />

                {mode === 'edit' && arrows.map(a => (
                  <g key={a.id}>
                    <line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="#fbbf24" strokeWidth="2" />
                    <polygon points={arrowHead(a.x1, a.y1, a.x2, a.y2)} fill="#fbbf24" />
                  </g>
                ))}
                {mode === 'edit' && zones.map(z => (
                  <circle key={z.id} cx={z.cx} cy={z.cy} r={z.r} stroke="#3b82f6" strokeWidth="1.5" fill="rgba(59,130,246,0.08)" strokeDasharray="6 3" />
                ))}
                {mode === 'edit' && texts.map(t => (
                  <text key={t.id} x={t.x} y={t.y} fill="#f5f3ff" fontSize="14" fontWeight="700" textAnchor="middle" dominantBaseline="middle">{t.text}</text>
                ))}

                {mode === 'playback' && showPrediction && [...teamATokens, ...teamBTokens].map(t => t.predicted && (
                  <g key={`pred_${t.id}`}>
                    <line x1={t.x} y1={t.y} x2={t.predicted.x} y2={t.predicted.y} stroke="rgba(251,191,36,0.75)" strokeWidth="1.5" strokeDasharray="4 3" />
                    <circle cx={t.predicted.x} cy={t.predicted.y} r="6" fill="none" stroke="rgba(251,191,36,0.75)" strokeWidth="1.5" strokeDasharray="3 3" />
                  </g>
                ))}

                {mode === 'playback' && showLabels && [...teamATokens, ...teamBTokens].map(t => (t.role && t.role !== 'unknown') && (
                  <text key={`role_${t.id}`} x={t.x} y={t.y + 27} fill="#f5f3ff" fontSize="10" fontWeight="700" textAnchor="middle">{t.role}</text>
                ))}
              </svg>

              {ballPos && (
                <div style={{ left: `${(ballPos.x / PITCH_W) * 100}%`, top: `${(ballPos.y / PITCH_H) * 100}%` }}
                  className="absolute w-3.5 h-3.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50 border border-amber-200 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" />
              )}

              {teamATokens.map(t => (
                <div key={t.id}
                  onMouseDown={(e) => { if (mode === 'playback') return; if (activeTool === 'select') { e.stopPropagation(); setDraggedToken({ ...t, team: 'A' }); } }}
                  style={{ left: `${(t.x / PITCH_W) * 100}%`, top: `${(t.y / PITCH_H) * 100}%` }}
                  className={`player-token team-a flex items-center justify-center ${mode === 'playback' ? 'pointer-events-none transition-all duration-75' : ''}`}>
                  {t.number}
                </div>
              ))}
              {teamBTokens.map(t => (
                <div key={t.id}
                  onMouseDown={(e) => { if (mode === 'playback') return; if (activeTool === 'select') { e.stopPropagation(); setDraggedToken({ ...t, team: 'B' }); } }}
                  style={{ left: `${(t.x / PITCH_W) * 100}%`, top: `${(t.y / PITCH_H) * 100}%` }}
                  className={`player-token team-b flex items-center justify-center ${mode === 'playback' ? 'pointer-events-none transition-all duration-75' : ''}`}>
                  {t.number}
                </div>
              ))}
            </div>

            {mode === 'playback' && (
              <div className="mt-3 flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500" /> Home Team</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-400" /> Away Team</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400" /> Ball</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border border-dashed border-amber-400" /> Predicted position</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-500/40 border border-cyan-400" /> Role label</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {mode === 'edit' && (
              <>
                <div className="glass-card p-5 space-y-4">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b border-purple-500/20 pb-2">Tactical Canvas Tools</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ id: 'select', label: 'MOVE', icon: Move }, { id: 'arrow', label: 'ARROW', icon: ArrowRight }, { id: 'zone', label: 'ZONE', icon: Circle }, { id: 'text', label: 'LABEL', icon: Type }].map(tool => {
                      const Icon = tool.icon;
                      return (
                        <button key={tool.id} onClick={() => setActiveTool(tool.id)} className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}>
                          <Icon className="w-4 h-4" /><span>{tool.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted text-center">
                    {activeTool === 'select' && 'Click & drag players to reposition'}
                    {activeTool === 'arrow' && 'Click start → release at end'}
                    {activeTool === 'zone' && 'Click center → drag radius'}
                    {activeTool === 'text' && 'Click position → type label'}
                  </p>
                </div>

                <div className="glass-card p-5 space-y-4">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b border-purple-500/20 pb-2">Pitch Tokens</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary">Our Team (Purple)</span>
                      <button onClick={() => addToken('A')} className="btn-secondary text-[11px] py-1 px-2.5"><Plus className="w-3 h-3" /> Add</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted">Opponent (Gray)</span>
                      <button onClick={() => addToken('B')} className="btn-secondary text-[11px] py-1 px-2.5"><Plus className="w-3 h-3" /> Add</button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button onClick={clearAll} className="w-full btn-secondary text-xs text-red-400 border-red-500/30 hover:border-red-500 justify-center">
                      <Trash2 className="w-3.5 h-3.5" /> Clear All
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode === 'playback' && (
              <div className="glass-card p-5 space-y-4">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b border-purple-500/20 pb-2">Playback Controls</h3>
                <div className="space-y-2 text-xs">
                  <p className="text-secondary">Watching AI-tracked player positions animated on the pitch.</p>
                  <p className="text-muted">Use the timeline slider to jump to any moment.</p>
                  <p className="text-muted">Click <span className="text-cyan-400 font-bold">Snapshot Schema</span> to save current formation as a tactic.</p>
                </div>
                {playbackData && (
                  <div className="text-[10px] text-muted font-mono space-y-1 pt-2 border-t border-purple-500/10">
                    <div>Frames: {playbackData.frame_count}</div>
                    <div>Sample Rate: every {playbackData.sample_rate} frames</div>
                    <div>Source FPS: {playbackData.fps}</div>
                  </div>
                )}
              </div>
            )}

            <div className="glass-card p-5 space-y-4">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b border-purple-500/20 pb-2">Saved Tactics</h3>
              {tactics.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No saved tactics for this match yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tactics.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-purple-500/10 text-xs">
                      <button onClick={() => loadTactic(t)} className="text-primary hover:text-heading text-left flex-1 truncate">{t.name}</button>
                      <button onClick={() => handleDeleteTactic(t.id)} className="text-muted hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {textPrompt && mode === 'edit' && (
        <div className="modal-overlay" onClick={() => setTextPrompt(null)}>
          <form onSubmit={handleTextSubmit} className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-heading mb-3">Enter Label Text</h3>
            <input name="text" autoFocus className="input-dark mb-4" placeholder="e.g. Press, Cover" maxLength={20} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTextPrompt(null)} className="btn-secondary text-xs">Cancel</button>
              <button type="submit" className="btn-primary text-xs">Place Label</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
