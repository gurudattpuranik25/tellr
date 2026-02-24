import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
import Groups from './components/Groups'
import GroupDetail from './components/GroupDetail'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import { ThemeProvider } from './context/ThemeContext'
import { useTheme } from './context/ThemeContext'

function AppContent() {
  const { user, loading } = useAuth()
  const { isDark } = useTheme()

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-body">Loading Tellr...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            color: isDark ? '#f8fafc' : '#0f172a',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: '"DM Sans", sans-serif',
          },
          success: { iconTheme: { primary: '#10b981', secondary: isDark ? '#f8fafc' : '#0f172a' } },
          error: { iconTheme: { primary: '#ef4444', secondary: isDark ? '#f8fafc' : '#0f172a' } },
        }}
      />
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
        />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/groups"
          element={<ProtectedRoute><Groups /></ProtectedRoute>}
        />
        <Route
          path="/groups/:id"
          element={<ProtectedRoute><GroupDetail /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
