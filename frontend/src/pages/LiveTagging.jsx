import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react';
import api from '../api';
import { Play, Pause, RotateCcw, Target, AlertTriangle, ShieldAlert, Flag, Clock, Trash2, Video, ScanEye, Loader2, CheckCircle2, XCircle, BarChart3, Activity, Timer } from 'lucide-react';

export default function LiveTagging() {
  const { matchId: paramMatchId } = useParams();
  const [matchId, setMatchId] = useState(paramMatchId ? parseInt(paramMatchId) : null);
  const [matches, setMatches] = useState([]);
  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [videoData, setVideoData] = useState(null);

  const [trackingStatus, setTrackingStatus] = useState(null);
  const [trackingSummary, setTrackingSummary] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [half, setHalf] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const videoRef = useRef(null);

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { if (matchId) fetchMatchData(); }, [matchId]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const fetchInitialData = async () => {
    try {
      const meRes = await api.get('/me');
      const teamId = meRes.data.data.team_id || meRes.data.data.owned_teams?.[0]?.id;
      if (!teamId) return;

      const [matchesRes, playersRes] = await Promise.all([
        api.get(`/teams/${teamId}/matches`),
        api.get(`/teams/${teamId}/players`)
      ]);

      const mList = matchesRes.data.data || [];
      setMatches(mList);
      setPlayers(playersRes.data.data || []);

      const activeM = mList.find(m => m.id == matchId) || mList[0];
      if (activeM) {
        setMatch(activeM);
        setMatchId(activeM.id);
      }
    } catch (err) {
      console.error('Failed to load live tagging data:', err);
    }
  };

  const fetchMatchData = async () => {
    try {
      const [eventsRes, videoRes] = await Promise.allSettled([
        api.get(`/matches/${matchId}/events`),
        api.get(`/matches/${matchId}/video`)
      ]);

      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value.data.data || []);
      }
      if (videoRes.status === 'fulfilled' && videoRes.value.data.success) {
        setVideoData(videoRes.value.data.data);
      } else {
        setVideoData(null);
      }
    } catch (err) {
      console.error('Failed to load match data:', err);
    }
  };

  const syncTimerFromVideo = () => {
    if (videoRef.current) {
      const t = Math.floor(videoRef.current.currentTime);
      setSeconds(t);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isRunning) {
        videoRef.current.pause();
        setIsRunning(false);
      } else {
        const t = videoRef.current.currentTime;
        setSeconds(Math.floor(t));
        videoRef.current.play();
        setIsRunning(true);
      }
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleAddEvent = async (eventType) => {
    const minuteVal = Math.floor(seconds / 60);
    const secondVal = seconds % 60;

    try {
      const payload = {
        player_id: selectedPlayer ? selectedPlayer.id : null,
        event_type: eventType,
        half: half,
        minute: minuteVal,
        second: secondVal,
        notes: selectedPlayer ? `Action by #${selectedPlayer.jersey_number} ${selectedPlayer.name}` : 'Team Event'
      };

      const res = await api.post(`/matches/${matchId}/events`, payload);
      setEvents([res.data.data, ...events]);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambahkan event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await api.delete(`/events/${eventId}`);
      setEvents(events.filter(e => e.id !== eventId));
    } catch {
      alert('Gagal menghapus event');
    }
  };

  const fetchTrackingStatus = async () => {
    if (!matchId) return;
    try {
      const res = await api.get(`/matches/${matchId}/tracking/status`);
      setTrackingStatus(res.data.data);
      if (res.data.data.status === 'done') {
        const sumRes = await api.get(`/matches/${matchId}/tracking/summary`);
        setTrackingSummary(sumRes.data.data);
      }
    } catch {
      // tracking not available
    }
  };

  const handleQueueTracking = async () => {
    if (!matchId) return;
    setTrackingLoading(true);
    try {
      const res = await api.post(`/matches/${matchId}/tracking/queue`);
      setTrackingStatus(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memulai tracking');
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => { if (matchId) fetchTrackingStatus(); }, [matchId]);

  const formatTime = (totalSec) => {
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-xl font-bold text-white uppercase tracking-wide">
              Live Telemetry — {match ? `${match.team?.name || ''} vs ${match.opponent_name}` : 'Match Tagging'}
            </h1>
          </div>
          <p className="text-xs text-purple-300/60 mt-1">Real-time match event logger & tactical data stream</p>
        </div>

        <select
          value={matchId || ''}
          onChange={(e) => { setMatchId(parseInt(e.target.value)); const m = matches.find(item => item.id == e.target.value); setMatch(m); }}
          className="input-dark text-xs w-auto min-w-[220px]"
        >
          {matches.map(m => (
            <option key={m.id} value={m.id}>#{m.id} vs {m.opponent_name} ({m.status})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {videoData && (
            <div className="glass-card overflow-hidden border-purple-500/30">
              <div className="relative bg-black">
                <video
                  ref={videoRef}
                  src={videoData.url}
                  controls
                  className="w-full max-h-[340px] object-contain"
                  onTimeUpdate={syncTimerFromVideo}
                  onPlay={() => setIsRunning(true)}
                  onPause={() => setIsRunning(false)}
                />
              </div>
              <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-t border-purple-500/10">
                <div className="flex items-center gap-2 text-xs text-purple-300/70">
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span className="truncate max-w-[200px]">{videoData.original_name || 'Match Recording'}</span>
                </div>
                <span className="text-[10px] text-purple-500 font-mono">
                  Timer synced with video timeline
                </span>
              </div>
            </div>
          )}

          <div className="glass-card p-6 bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-widest">HALF {half} • FUTSAL TIMING</div>
              <div className="text-5xl font-black text-white font-mono tracking-tight mt-1">{formatTime(seconds)}</div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handlePlayPause} className={`btn-primary px-6 py-3 ${isRunning ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/30' : ''}`}>
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? 'PAUSE' : 'START'}
              </button>
              <button onClick={() => { setSeconds(0); setIsRunning(false); }} className="btn-secondary p-3" title="Reset Timer">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => setHalf(half === 1 ? 2 : 1)} className="btn-secondary px-4 py-3 text-xs font-bold">
                HALF {half === 1 ? '2' : '1'}
              </button>
            </div>
          </div>

          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Select Active On-Pitch Player</span>
              {selectedPlayer && (
                <button onClick={() => setSelectedPlayer(null)} className="text-xs text-purple-400 hover:underline">
                  Deselect (#{selectedPlayer.jersey_number})
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {players.map(p => (
                <button key={p.id} onClick={() => setSelectedPlayer(selectedPlayer?.id === p.id ? null : p)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedPlayer?.id === p.id
                      ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/30 scale-105'
                      : 'bg-black/30 text-purple-200 border-purple-500/20 hover:border-purple-500/50'
                  }`}>
                  <span className="w-5 h-5 rounded-full bg-purple-900/60 text-purple-300 flex items-center justify-center font-bold text-[10px]">{p.jersey_number}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" /> Match Event Stream
              </h3>
              <span className="text-xs text-purple-400/60 font-mono">{events.length} Events Logged</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="text-center py-8 text-xs text-purple-300/50">No events logged yet. Click quick tags on the right to log actions.</div>
              ) : (
                events.map(evt => (
                  <div key={evt.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-purple-500/10 hover:border-purple-500/30 transition-all text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-purple-400 font-bold w-12">{evt.minute}'{evt.second > 0 ? `${evt.second}"` : ''} (H{evt.half})</span>
                      <span className={`badge badge-${evt.event_type}`}>{evt.event_type}</span>
                      <span className="text-purple-200 font-medium">{evt.player ? `#${evt.player.jersey_number} ${evt.player.name}` : 'Team Event'}</span>
                    </div>
                    <button onClick={() => handleDeleteEvent(evt.id)} className="text-purple-400/50 hover:text-red-400 p-1 transition-colors" title="Delete event">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-purple-500/20 pb-3">QUICK EVENT TAGS</div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleAddEvent('goal')} className="quick-tag goal">
                <Target className="w-8 h-8 text-emerald-400" />
                <span className="font-extrabold text-white text-sm">GOAL</span>
                <span className="text-[10px] text-emerald-400/80 font-mono">+1 Score</span>
              </button>
              <button onClick={() => handleAddEvent('shot')} className="quick-tag shot">
                <Flag className="w-8 h-8 text-blue-400" />
                <span className="font-extrabold text-white text-sm">SHOT</span>
                <span className="text-[10px] text-blue-400/80 font-mono">Attempt</span>
              </button>
              <button onClick={() => handleAddEvent('foul')} className="quick-tag foul">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
                <span className="font-extrabold text-white text-sm">FOUL</span>
                <span className="text-[10px] text-amber-400/80 font-mono">Infraction</span>
              </button>
              <button onClick={() => handleAddEvent('turnover')} className="quick-tag turnover">
                <ShieldAlert className="w-8 h-8 text-purple-400" />
                <span className="font-extrabold text-white text-sm">TURNOVER</span>
                <span className="text-[10px] text-purple-400/80 font-mono">Lost Ball</span>
              </button>
            </div>
            <p className="text-[11px] text-purple-300/50 text-center pt-2">
              Tip: Click a player chip above first to associate the event directly with them.
            </p>
          </div>

          <div className="glass-card p-6 space-y-4 border-purple-500/20">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-purple-500/20 pb-3 flex items-center gap-2">
              <ScanEye className="w-4 h-4 text-cyan-400" />
              AI TRACKING
            </div>

            {trackingStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-300/70">Status</span>
                  {trackingStatus.status === 'done' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  )}
                  {trackingStatus.status === 'processing' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-blue-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
                    </span>
                  )}
                  {trackingStatus.status === 'queued' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Timer className="w-3.5 h-3.5" /> Queued
                    </span>
                  )}
                  {trackingStatus.status === 'failed' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-400">
                      <XCircle className="w-3.5 h-3.5" /> Failed
                    </span>
                  )}
                  {trackingStatus.status === 'none' && (
                    <span className="text-xs text-purple-400/50">Not started</span>
                  )}
                </div>

                {trackingStatus.total_frames_processed > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-purple-400/70">
                      <span>Progress</span>
                      <span>{trackingStatus.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${trackingStatus.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-purple-400/50 font-mono">
                      {trackingStatus.total_frames_processed} frames
                    </span>
                  </div>
                )}

                {trackingSummary && (
                  <div className="space-y-2 pt-2 border-t border-purple-500/10">
                    <div className="flex items-center gap-2 text-xs">
                      <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-purple-300/70">Possession</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-400 font-bold w-12">Home</span>
                      <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${trackingSummary.ball_possession?.home || 50}%` }}
                        />
                      </div>
                      <span className="text-white font-mono w-10 text-right">{trackingSummary.ball_possession?.home || 0}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-blue-400 font-bold w-12">Away</span>
                      <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${trackingSummary.ball_possession?.away || 50}%` }}
                        />
                      </div>
                      <span className="text-white font-mono w-10 text-right">{trackingSummary.ball_possession?.away || 0}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs pt-1">
                      <Activity className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-purple-300/70">
                        Distance: <span className="text-white font-bold">{trackingSummary.distance_covered?.home || 0}m</span> home / <span className="text-white font-bold">{trackingSummary.distance_covered?.away || 0}m</span> away
                      </span>
                    </div>
                    <div className="text-[10px] text-purple-400/50 font-mono pt-1">
                      {trackingSummary.total_player_datapoints} player pts • {trackingSummary.total_ball_datapoints} ball pts • {trackingSummary.total_frames_tracked} frames
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-purple-300/50 text-center py-2">
                No tracking data. Click below to start AI analysis.
              </p>
            )}

            <button
              onClick={handleQueueTracking}
              disabled={trackingLoading || trackingStatus?.status === 'processing' || trackingStatus?.status === 'queued'}
              className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
                trackingLoading || trackingStatus?.status === 'processing' || trackingStatus?.status === 'queued'
                  ? 'bg-purple-900/30 text-purple-400/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:from-cyan-500 hover:to-purple-500 shadow-lg shadow-purple-500/20'
              }`}
            >
              {trackingLoading || trackingStatus?.status === 'processing' || trackingStatus?.status === 'queued' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {trackingStatus?.status === 'processing' ? 'Processing...' : 'Queued...'}
                </>
              ) : (
                <>
                  <ScanEye className="w-3.5 h-3.5" />
                  {trackingStatus?.status === 'done' ? 'Re-Analyze' : 'Start AI Analysis'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
