import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import App from './App';
import StatusPage from './components/StatusPage';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ToastProvider';

function AppRouter() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Main Dashboard (Private) */}
            <Route path="/" element={<App />} />
            <Route path="/dashboard" element={<App />} />
            
            {/* Public Status Page */}
            <Route path="/status" element={<StatusPage />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default AppRouter;