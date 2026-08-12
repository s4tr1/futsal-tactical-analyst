import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('analyst@team.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-root flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] rounded-full bg-purple-700/10 blur-3xl" />
        <div className="absolute top-1/2 -left-60 w-[400px] h-[400px] rounded-full bg-indigo-700/8 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-[300px] h-[300px] rounded-full bg-violet-700/8 blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-700 to-purple-500 shadow-lg shadow-purple-500/25 mb-5">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-heading tracking-tight leading-tight">
            FUTSIGHT
          </h1>
          <p className="text-xs text-muted font-semibold tracking-widest uppercase mt-1.5">
            Futsal Tactical Analyst
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="analyst@team.com" className="input-dark pl-10"
                />
              </div>
            </div>

            <div>
              <label>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required placeholder="••••••••" className="input-dark pl-10"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 justify-center text-sm">
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>Sign in to Dashboard <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-purple-500/10 text-center">
            <p className="text-xs text-muted">
              Demo: <span className="text-secondary font-mono text-[11px]">analyst@team.com</span>
              <span className="mx-1.5 text-[#3d3755]">/</span>
              <span className="text-secondary font-mono text-[11px]">password</span>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#3d3755] font-mono mt-8">
          System v2 &middot; Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
