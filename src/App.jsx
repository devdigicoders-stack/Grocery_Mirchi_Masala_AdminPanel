import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Vendors from './pages/Vendors'
import ItemMaster from './pages/ItemMaster'
import Demands from './pages/Demands'
import Quotations from './pages/Quotations'
import Allocations from './pages/Allocations'
import Reports from './pages/Reports'
import EmailLogs from './pages/EmailLogs'
import Settings from './pages/Settings'
import { getStoredToken, authService } from './services/api'

// Strict Protected Route: Blocks access if no JWT token is stored
function ProtectedRoute({ onLogout }) {
  const token = getStoredToken()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <DashboardLayout onLogout={onLogout} />
}

// Public Route: Redirects to dashboard if already authenticated
function PublicRoute({ children }) {
  const token = getStoredToken()

  if (token) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const [, setAuthTick] = useState(0)

  const handleLogin = () => {
    setAuthTick((prev) => prev + 1)
  }

  const handleLogout = () => {
    authService.logout()
    setAuthTick((prev) => prev + 1)
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route (Redirects to dashboard if already logged in) */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login onLogin={handleLogin} />
            </PublicRoute>
          }
        />

        {/* Protected Dashboard Routes (Strictly requires valid JWT token) */}
        <Route element={<ProtectedRoute onLogout={handleLogout} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/item-master" element={<ItemMaster />} />
          <Route path="/demands" element={<Demands />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/allocations" element={<Allocations />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/email-logs" element={<EmailLogs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
