import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import LiveTagging from './pages/LiveTagging';
import TacticalBoard from './pages/TacticalBoard';
import VideoUpload from './pages/VideoUpload';
import Statistics from './pages/Statistics';
import Reports from './pages/Reports';
import Players from './pages/Players';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070510] flex items-center justify-center text-purple-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#070510]">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <div className="page-content">{children}</div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070510] flex items-center justify-center text-purple-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/matches" element={<ProtectedLayout><Matches /></ProtectedLayout>} />
      <Route path="/live-tagging" element={<ProtectedLayout><LiveTagging /></ProtectedLayout>} />
      <Route path="/live-tagging/:matchId" element={<ProtectedLayout><LiveTagging /></ProtectedLayout>} />
      <Route path="/tactical-board" element={<ProtectedLayout><TacticalBoard /></ProtectedLayout>} />
      <Route path="/video-upload" element={<ProtectedLayout><VideoUpload /></ProtectedLayout>} />
      <Route path="/statistics" element={<ProtectedLayout><Statistics /></ProtectedLayout>} />
      <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
      <Route path="/players" element={<ProtectedLayout><Players /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
