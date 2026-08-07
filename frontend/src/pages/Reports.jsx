import React, { useEffect, useState } from 'react';
import api from '../api';
import { FileText, Download, Calendar, MapPin } from 'lucide-react';

export default function Reports() {
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

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
        setSelectedMatchId(mList[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (mId) => {
    const idToUse = mId || selectedMatchId;
    setDownloading(true);

    try {
      const response = await api.get(`/matches/${idToUse}/report`, {
        responseType: 'blob',
      });

      // Create download link for PDF
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sipijar-Match-Report-#${idToUse}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Gagal mendownload laporan PDF. Pastikan DomPDF terinstall di backend.');
    } finally {
      setDownloading(false);
    }
  };

  const selectedMatch = matches.find(m => m.id == selectedMatchId);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Executive PDF Match Reports</h1>
        <p className="text-sm text-purple-300/70 mt-1">Generate comprehensive post-match technical analysis & PDF summaries</p>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-purple-400/60">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4" />
          Loading report fixtures...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Match Selection */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Select Match</h3>
            <div className="space-y-2">
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatchId(m.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedMatchId == m.id
                      ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'bg-black/20 border-purple-500/10 hover:border-purple-500/30'
                  }`}
                >
                  <div className="text-xs text-purple-400 font-mono">Fixture #{m.id}</div>
                  <div className="font-bold text-white text-sm mt-0.5">vs {m.opponent_name}</div>
                  <div className="text-xs text-purple-300/60 mt-1 flex justify-between">
                    <span>{m.match_date ? new Date(m.match_date).toLocaleDateString('id-ID') : 'TBD'}</span>
                    <span className="capitalize">{m.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: PDF Preview Card */}
          <div className="md:col-span-2">
            {selectedMatch ? (
              <div className="glass-card p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
                      <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-base">Match Report #{selectedMatch.id}</h2>
                      <p className="text-xs text-purple-300/60">Executive Technical Analysis PDF Document</p>
                    </div>
                  </div>

                  <span className={`badge badge-${selectedMatch.status}`}>
                    {selectedMatch.status}
                  </span>
                </div>

                {/* Score Banner */}
                <div className="bg-black/30 p-6 rounded-2xl border border-purple-500/20 text-center flex items-center justify-around">
                  <div>
                    <div className="text-xs text-purple-400 font-semibold uppercase">Home Team</div>
                    <div className="text-xl font-bold text-white mt-1">{selectedMatch.team?.name || 'Home'}</div>
                    <div className="text-3xl font-black text-purple-400 mt-2">{selectedMatch.score_team ?? 0}</div>
                  </div>

                  <div className="text-xl font-mono text-purple-400/60 font-bold">VS</div>

                  <div>
                    <div className="text-xs text-purple-400 font-semibold uppercase">Away Team</div>
                    <div className="text-xl font-bold text-purple-200 mt-1">{selectedMatch.opponent_name}</div>
                    <div className="text-3xl font-black text-purple-400 mt-2">{selectedMatch.score_opponent ?? 0}</div>
                  </div>
                </div>

                {/* Match Metadata */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2 text-purple-300/80">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>Date: {selectedMatch.match_date ? new Date(selectedMatch.match_date).toLocaleDateString('id-ID') : 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-300/80">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span>Location: {selectedMatch.location || 'GOR Serbaguna'}</span>
                  </div>
                </div>

                {/* Generate PDF CTA */}
                <div className="pt-4 border-t border-purple-500/20">
                  <button
                    onClick={() => handleDownloadReport(selectedMatch.id)}
                    disabled={downloading}
                    className="btn-primary w-full py-3 text-sm justify-center gap-2"
                  >
                    {downloading ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Download className="w-4 h-4" /> GENERATE & DOWNLOAD PDF REPORT
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-purple-300/50 text-center mt-2">
                    PDF includes score summary, event timelines, shot accuracy metrics, and tactical routine diagrams.
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center text-purple-400/60">
                Select a match to preview and export its PDF report.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
