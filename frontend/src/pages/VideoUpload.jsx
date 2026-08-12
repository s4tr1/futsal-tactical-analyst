import React, { useEffect, useState } from 'react';
import { UploadCloud, FileVideo, CheckCircle2, Film, AlertCircle } from 'lucide-react';
import api from '../api';

export default function VideoUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [matchId, setMatchId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (matchId) {
      fetchVideos();
    }
  }, [matchId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const meRes = await api.get('/me');
      const teamId = meRes.data.data.team_id || meRes.data.data.owned_teams?.[0]?.id;
      if (!teamId) return;
      const res = await api.get(`/teams/${teamId}/matches`);
      const mList = res.data.data || [];
      setMatches(mList);
      if (mList.length > 0) {
        setMatchId(mList[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const results = [];
      for (const m of matches) {
        try {
          const res = await api.get(`/matches/${m.id}/video`);
          if (res.data.data) {
            results.push({ ...res.data.data, match: m });
          }
        } catch {
          // No video uploaded for this match
        }
      }
      setVideos(results);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        setErrorMsg('Ukuran file maksimal 500 MB.');
        return;
      }
      setSelectedFile(file);
      setErrorMsg('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !matchId) return;
    setUploading(true);
    setProgress(20);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);

      await api.post(`http://127.0.0.1:8000/api/matches/${matchId}/video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });

      setProgress(100);
      setSuccessMsg(`Video "${selectedFile.name}" berhasil diunggah!`);
      setSelectedFile(null);
      fetchVideos();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengunggah video.');
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'Unknown';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Match Video Upload Center</h1>
        <p className="text-sm text-purple-300/70 mt-1">Upload raw match recording for automated telemetry & replay clipping</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-purple-400 font-semibold">Match:</span>
        <select value={matchId || ''} onChange={(e) => setMatchId(parseInt(e.target.value))} className="input-dark text-xs w-auto min-w-[220px]">
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              #{m.id} vs {m.opponent_name} ({m.status})
            </option>
          ))}
        </select>
      </div>

      <div className="glass-card p-10 space-y-6 text-center">
        <label className="drop-zone block cursor-pointer">
          <input type="file" accept="video/mp4,video/mov,video/avi" onChange={handleFileSelect} className="hidden" />
          <UploadCloud className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-white">Drag & Drop Footage Here</h3>
          <p className="text-xs text-purple-300/60 mt-1">Supports MP4, MOV, AVI (Max File Size 500 MB)</p>
          <button type="button" className="btn-secondary text-xs mt-4">
            Browse Video Files
          </button>
        </label>

        {selectedFile && (
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <FileVideo className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-sm font-bold text-white">{selectedFile.name}</div>
                <div className="text-xs text-purple-300/60 font-mono">{formatBytes(selectedFile.size)}</div>
              </div>
            </div>
            <button onClick={handleUpload} disabled={uploading} className="btn-primary text-xs py-2 px-4">
              {uploading ? 'UPLOADING...' : 'START UPLOAD'}
            </button>
          </div>
        )}

        {uploading && (
          <div className="space-y-2 text-left">
            <div className="flex justify-between text-xs text-purple-300">
              <span>Processing Video Encoding...</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Film className="w-4 h-4 text-purple-400" /> Uploaded Footage Archive
        </h3>

        {loading ? (
          <div className="text-center py-4 text-xs text-purple-400/60">Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="text-center py-4 text-xs text-purple-400/50">No videos uploaded yet. Select a match and upload a video.</div>
        ) : (
          <div className="space-y-3">
            {videos.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-purple-500/10">
                <div className="flex items-center gap-3">
                  <FileVideo className="w-6 h-6 text-purple-400" />
                  <div>
                    <div className="text-sm font-bold text-white">{v.original_name || 'Video #' + v.id}</div>
                    <div className="text-xs text-purple-400/60 font-mono">
                      Match #{v.match_id} vs {v.match?.opponent_name || ''} &bull; {formatBytes(v.file_size)}
                    </div>
                  </div>
                </div>
                <span className="badge badge-victory">UPLOADED</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
