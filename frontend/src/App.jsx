import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import Highlights from './pages/Highlights';

function ProtectedLayout() {
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
      <div className="page-content"><Outlet /></div>
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
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/live-tagging" element={<LiveTagging />} />
        <Route path="/live-tagging/:matchId" element={<LiveTagging />} />
        <Route path="/tactical-board" element={<TacticalBoard />} />
        <Route path="/video-upload" element={<VideoUpload />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/players" element={<Players />} />
        <Route path="/highlights" element={<Highlights />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
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
