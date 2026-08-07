import React, { useEffect, useState, useRef } from 'react';
import { Save, Trash2, Move, ArrowRight, Circle, Type, Plus } from 'lucide-react';
import api from '../api';

const PITCH_W = 800;
const PITCH_H = 520;
const MARGIN = 30;

export default function TacticalBoard() {
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

  const [draggedToken, setDraggedToken] = useState(null);

  const [arrows, setArrows] = useState([]);
  const [zones, setZones] = useState([]);
  const [texts, setTexts] = useState([]);
  const [drawStart, setDrawStart] = useState(null);
  const [textPrompt, setTextPrompt] = useState(null);

  const pitchRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => { fetchMatches(); }, []);
  useEffect(() => { if (selectedMatchId) fetchTactics(); }, [selectedMatchId]);

  const fetchMatches = async () => {
    try {
      const meRes = await api.get('/me');
      const teamId = meRes.data.data.team_id || meRes.data.data.owned_teams?.[0]?.id;
      if (!teamId) return;
      const res = await api.get(`/teams/${teamId}/matches`);
      const mList = res.data.data || [];
      setMatches(mList);
      if (mList.length > 0 && !selectedMatchId) setSelectedMatchId(mList[0].id);
    } catch (err) { console.error('Failed to fetch matches:', err); }
  };

  const fetchTactics = async () => {
    try {
      const res = await api.get(`/matches/${selectedMatchId}/tactics`);
      setTactics(res.data.data || []);
    } catch (err) { console.error('Failed to fetch tactics:', err); }
  };

  const loadTactic = (tactic) => {
    setTacticName(tactic.name);
    const json = typeof tactic.canvas_json === 'string' ? JSON.parse(tactic.canvas_json) : tactic.canvas_json;
    if (json.teamA) setTeamATokens(json.teamA);
    if (json.teamB) setTeamBTokens(json.teamB);
    if (json.arrows) setArrows(json.arrows);
    if (json.zones) setZones(json.zones);
    if (json.texts) setTexts(json.texts);
  };

  const getSvgCoords = (e) => {
    const rect = pitchRef.current.getBoundingClientRect();
    const scaleX = PITCH_W / rect.width;
    const scaleY = PITCH_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const isOnToken = (mx, my) => {
    const all = [...teamATokens.map(t => ({ ...t, team: 'A' })), ...teamBTokens.map(t => ({ ...t, team: 'B' }))];
    return all.find(t => Math.hypot(t.x - mx, t.y - my) < 22);
  };

  const handlePitchMouseDown = (e) => {
    const coords = getSvgCoords(e);
    if (coords.x < MARGIN || coords.y < MARGIN || coords.x > PITCH_W - MARGIN || coords.y > PITCH_H - MARGIN) return;

    if (activeTool === 'select') {
      const token = isOnToken(coords.x, coords.y);
      if (token) setDraggedToken(token);
      return;
    }

    if (activeTool === 'arrow') {
      setDrawStart(coords);
      return;
    }

    if (activeTool === 'zone') {
      setDrawStart(coords);
      return;
    }

    if (activeTool === 'text') {
      setTextPrompt({ x: coords.x, y: coords.y });
    }
  };

  const handlePitchMouseMove = (e) => {
    if (draggedToken) {
      const coords = getSvgCoords(e);
      const x = Math.max(MARGIN, Math.min(PITCH_W - MARGIN, coords.x));
      const y = Math.max(MARGIN, Math.min(PITCH_H - MARGIN, coords.y));
      if (draggedToken.team === 'A') {
        setTeamATokens(prev => prev.map(t => t.id === draggedToken.id ? { ...t, x, y } : t));
      } else {
        setTeamBTokens(prev => prev.map(t => t.id === draggedToken.id ? { ...t, x, y } : t));
      }
    }
  };

  const handlePitchMouseUp = (e) => {
    if (draggedToken) { setDraggedToken(null); return; }
    if (!drawStart) return;

    const coords = getSvgCoords(e);
    const cx = Math.max(MARGIN, Math.min(PITCH_W - MARGIN, coords.x));
    const cy = Math.max(MARGIN, Math.min(PITCH_H - MARGIN, coords.y));

    if (activeTool === 'arrow') {
      const dist = Math.hypot(cx - drawStart.x, cy - drawStart.y);
      if (dist > 8) {
        setArrows([...arrows, { id: Date.now(), x1: drawStart.x, y1: drawStart.y, x2: cx, y2: cy }]);
      }
      setDrawStart(null);
    }

    if (activeTool === 'zone') {
      const r = Math.hypot(cx - drawStart.x, cy - drawStart.y);
      if (r > 6) {
        setZones([...zones, { id: Date.now(), cx: drawStart.x, cy: drawStart.y, r }]);
      }
      setDrawStart(null);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    const val = e.target.text.value.trim();
    if (val && textPrompt) {
      setTexts([...texts, { id: Date.now(), x: textPrompt.x, y: textPrompt.y, text: val }]);
    }
    setTextPrompt(null);
  };

  const clearAll = () => {
    setTeamATokens([]);
    setTeamBTokens([]);
    setArrows([]);
    setZones([]);
    setTexts([]);
  };

  const addToken = (team) => {
    if (team === 'A') {
      setTeamATokens([...teamATokens, { id: `a_${Date.now()}`, number: teamATokens.length + 1, x: 150, y: 260 }]);
    } else {
      setTeamBTokens([...teamBTokens, { id: `b_${Date.now()}`, number: teamBTokens.length + 1, x: 650, y: 260 }]);
    }
  };

  const handleSaveTactic = async () => {
    if (!selectedMatchId) { alert('Pilih pertandingan terlebih dahulu.'); return; }
    try {
      const payload = {
        name: tacticName,
        canvas_json: { teamA: teamATokens, teamB: teamBTokens, arrows, zones, texts }
      };
      await api.post(`/matches/${selectedMatchId}/tactics`, payload);
      alert('Taktik berhasil disimpan!');
      fetchTactics();
    } catch (err) { alert(err?.response?.data?.message || 'Gagal menyimpan taktik'); }
  };

  const handleDeleteTactic = async (id) => {
    try {
      await api.delete(`/tactics/${id}`);
      setTactics(prev => prev.filter(t => t.id !== id));
    } catch { alert('Gagal menghapus taktik'); }
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Interactive Tactical Board</h1>
          <p className="text-sm text-purple-300/70 mt-1">Design set-pieces, power play routines & defensive formations</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedMatchId || ''} onChange={(e) => setSelectedMatchId(parseInt(e.target.value))} className="input-dark text-xs py-2 w-48">
            <option value="" disabled>Pilih Pertandingan</option>
            {matches.map(m => (<option key={m.id} value={m.id}>vs {m.opponent_name} (#{m.id})</option>))}
          </select>
          <input type="text" value={tacticName} onChange={(e) => setTacticName(e.target.value)} className="input-dark text-xs py-2 w-44" placeholder="Tactic Routine Name" />
          <button onClick={handleSaveTactic} className="btn-primary text-xs py-2"><Save className="w-3.5 h-3.5" /> Save Routine</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div ref={pitchRef} className="relative w-full bg-[#0d1a10] border-2 border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl select-none cursor-crosshair" style={{ aspectRatio: `${PITCH_W}/${PITCH_H}` }}
            onMouseDown={handlePitchMouseDown} onMouseMove={handlePitchMouseMove} onMouseUp={handlePitchMouseUp}
          >
            <svg ref={svgRef} viewBox={`0 0 ${PITCH_W} ${PITCH_H}`} className="absolute inset-0 w-full h-full pointer-events-none">
              <rect x={MARGIN} y={MARGIN} width={PITCH_W - MARGIN * 2} height={PITCH_H - MARGIN * 2} rx="8" stroke="rgba(168,85,247,0.3)" fill="none" strokeWidth="1.5" />
              <line x1={PITCH_W / 2} y1={MARGIN} x2={PITCH_W / 2} y2={PITCH_H - MARGIN} stroke="rgba(168,85,247,0.3)" strokeWidth="1.5" />
              <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r="60" stroke="rgba(168,85,247,0.3)" fill="none" strokeWidth="1.5" />
              <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r="3" fill="rgba(168,85,247,0.5)" />
              <path d={`M ${MARGIN} ${PITCH_H / 2 - 70} A 90 90 0 0 1 ${MARGIN + 90} ${PITCH_H / 2} A 90 90 0 0 1 ${MARGIN} ${PITCH_H / 2 + 70}`} stroke="rgba(168, 85, 247, 0.5)" fill="none" strokeWidth="1.5" />
              <path d={`M ${PITCH_W - MARGIN} ${PITCH_H / 2 - 70} A 90 90 0 0 0 ${PITCH_W - MARGIN - 90} ${PITCH_H / 2} A 90 90 0 0 0 ${PITCH_W - MARGIN} ${PITCH_H / 2 + 70}`} stroke="rgba(168, 85, 247, 0.5)" fill="none" strokeWidth="1.5" />
              <circle cx={MARGIN + 70} cy={PITCH_H / 2} r="3" fill="rgba(168,85,247,0.5)" />
              <circle cx={PITCH_W - MARGIN - 70} cy={PITCH_H / 2} r="3" fill="rgba(168,85,247,0.5)" />

              {arrows.map(a => (
                <g key={a.id}>
                  <line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="#fbbf24" strokeWidth="2" />
                  <polygon points={arrowHead(a.x1, a.y1, a.x2, a.y2)} fill="#fbbf24" />
                </g>
              ))}
              {zones.map(z => (
                <circle key={z.id} cx={z.cx} cy={z.cy} r={z.r} stroke="#3b82f6" strokeWidth="1.5" fill="rgba(59,130,246,0.08)" strokeDasharray="6 3" />
              ))}
              {texts.map(t => (
                <text key={t.id} x={t.x} y={t.y} fill="#f5f3ff" fontSize="14" fontWeight="700" textAnchor="middle" dominantBaseline="middle">{t.text}</text>
              ))}
            </svg>

            {teamATokens.map(t => (
              <div key={t.id} onMouseDown={(e) => { if (activeTool === 'select') { e.stopPropagation(); setDraggedToken({ ...t, team: 'A' }); } }}
                style={{ left: `${(t.x / PITCH_W) * 100}%`, top: `${(t.y / PITCH_H) * 100}%` }} className="player-token team-a">
                {t.number}
              </div>
            ))}
            {teamBTokens.map(t => (
              <div key={t.id} onMouseDown={(e) => { if (activeTool === 'select') { e.stopPropagation(); setDraggedToken({ ...t, team: 'B' }); } }}
                style={{ left: `${(t.x / PITCH_W) * 100}%`, top: `${(t.y / PITCH_H) * 100}%` }} className="player-token team-b">
                {t.number}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b border-purple-500/20 pb-2">Tactical Canvas Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'select', label: 'MOVE', icon: Move },
                { id: 'arrow', label: 'ARROW', icon: ArrowRight },
                { id: 'zone', label: 'ZONE', icon: Circle },
                { id: 'text', label: 'LABEL', icon: Type },
              ].map(tool => {
                const Icon = tool.icon;
                return (
                  <button key={tool.id} onClick={() => setActiveTool(tool.id)} className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}>
                    <Icon className="w-4 h-4" /><span>{tool.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-purple-400/50 text-center">
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
                <span className="text-xs font-semibold text-purple-200">Our Team (Purple)</span>
                <button onClick={() => addToken('A')} className="btn-secondary text-[11px] py-1 px-2.5"><Plus className="w-3 h-3" /> Add</button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-300/60">Opponent (Gray)</span>
                <button onClick={() => addToken('B')} className="btn-secondary text-[11px] py-1 px-2.5"><Plus className="w-3 h-3" /> Add</button>
              </div>
            </div>
            <div className="pt-2">
              <button onClick={clearAll} className="w-full btn-secondary text-xs text-red-400 border-red-500/30 hover:border-red-500 justify-center">
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b border-purple-500/20 pb-2">Saved Tactics</h3>
            {tactics.length === 0 ? (
              <p className="text-xs text-purple-400/50 text-center py-4">No saved tactics for this match yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tactics.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-purple-500/10 text-xs">
                    <button onClick={() => loadTactic(t)} className="text-purple-200 hover:text-white text-left flex-1 truncate">{t.name}</button>
                    <button onClick={() => handleDeleteTactic(t.id)} className="text-purple-400/50 hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {textPrompt && (
        <div className="modal-overlay" onClick={() => setTextPrompt(null)}>
          <form onSubmit={handleTextSubmit} className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-3">Enter Label Text</h3>
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
