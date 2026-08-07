import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Trash2 } from 'lucide-react';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', jersey_number: '', position: '' });

  useEffect(() => { fetchPlayers(); }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const meRes = await api.get('/me');
      const teamId = meRes.data.data.team_id || meRes.data.data.owned_teams?.[0]?.id;
      if (!teamId) return;
      const res = await api.get(`/teams/${teamId}/players`);
      setPlayers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch players:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const meRes = await api.get('/me');
      const teamId = meRes.data.data.team_id || meRes.data.data.owned_teams?.[0]?.id;
      if (!teamId) return;

      if (editing) {
        await api.put(`/players/${editing.id}`, formData);
      } else {
        await api.post(`/teams/${teamId}/players`, formData);
      }
      setShowModal(false);
      setEditing(null);
      setFormData({ name: '', jersey_number: '', position: '' });
      fetchPlayers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan pemain.');
    }
  };

  const handleEdit = (player) => {
    setEditing(player);
    setFormData({ name: player.name, jersey_number: player.jersey_number, position: player.position || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus pemain ini?')) return;
    try {
      await api.delete(`/players/${id}`);
      setPlayers(players.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus pemain.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Team Roster</h1>
          <p className="text-sm text-purple-300/70 mt-1">Manage player profiles, jersey numbers & positions</p>
        </div>
        <button onClick={() => { setEditing(null); setFormData({ name: '', jersey_number: '', position: '' }); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Player
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-purple-400/60">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4" />
          Loading roster...
        </div>
      ) : players.length === 0 ? (
        <div className="glass-card p-12 text-center text-purple-300/60">
          No players registered yet. Add your first player!
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Player Name</th>
                <th>Position</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr key={p.id}>
                  <td className="font-mono font-bold text-purple-400">#{p.jersey_number}</td>
                  <td className="font-bold text-white">{p.name}</td>
                  <td className="text-purple-300">{p.position || '-'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(p)} className="text-xs text-purple-400 hover:text-purple-300">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">{editing ? 'Edit Player' : 'Add New Player'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label>Player Name</label>
                <input type="text" required placeholder="e.g. Ahmad Zaki" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-dark" />
              </div>
              <div>
                <label>Jersey Number (1-99)</label>
                <input type="number" required min={1} max={99} placeholder="e.g. 10" value={formData.jersey_number} onChange={e => setFormData({ ...formData, jersey_number: e.target.value })} className="input-dark" />
              </div>
              <div>
                <label>Position</label>
                <select value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} className="input-dark">
                  <option value="">Select Position</option>
                  <option value="Kiper">Kiper</option>
                  <option value="Flank">Flank</option>
                  <option value="Pivot">Pivot</option>
                  <option value="Anchor">Anchor</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-purple-500/20">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add'} Player</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
