import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import StatusPage from './components/StatusPage';
import AuthPage from './components/Auth/AuthPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider } from './context/AuthContext';

function AppRouter() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Authentication Page */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Protected Dashboard Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              } />
              
              {/* Public Status Page */}
              <Route path="/status" element={<StatusPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default AppRouter;