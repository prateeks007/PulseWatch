import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ToastProvider';
import axios from 'axios';

function UserSettings() {
  const { darkMode } = useContext(ThemeContext);
  const { getToken } = useAuth();
  const { addToast } = useToast();
  
  const [settings, setSettings] = useState({
    discord_webhook_url: '',
    message: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_BASE_URL}/api/user/settings`, { headers });
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      addToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(`${API_BASE_URL}/api/user/settings`, {
        discord_webhook_url: settings.discord_webhook_url
      }, { headers });
      
      addToast('Settings saved successfully!', 'success');
      fetchSettings(); // Refresh to get updated message
    } catch (error) {
      console.error('Error saving settings:', error);
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-300 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      {/* Title with Discord Icon */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-5 h-5 text-indigo-400">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
        </div>
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Discord Alerts
        </h3>
      </div>
      
      {/* Subtitle */}
      <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Receive alerts on your Discord server when a website goes down
      </p>

      {/* Status Message */}
      <div className={`text-sm mb-3 px-3 py-2 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
        {settings.message}
      </div>

      {/* Form */}
      <div className="space-y-3">
        <input
          type="url"
          value={settings.discord_webhook_url}
          onChange={(e) => setSettings(prev => ({ ...prev, discord_webhook_url: e.target.value }))}
          placeholder="https://discord.com/api/webhooks/..."
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />

        <button
          onClick={saveSettings}
          disabled={saving}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            saving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Compact Instructions */}
      <details className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <summary className="cursor-pointer hover:text-blue-500">How to get Discord webhook URL</summary>
        <ol className="list-decimal list-inside mt-2 space-y-1 pl-2">
          <li>Go to your Discord server settings</li>
          <li>Click "Integrations" → "Webhooks"</li>
          <li>Create a new webhook and copy the URL</li>
        </ol>
      </details>
    </div>
  );
}

export default UserSettings;