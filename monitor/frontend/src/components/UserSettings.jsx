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
    <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Discord Alerts
      </h3>
      
      <div className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {settings.message}
      </div>

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Discord Webhook URL
          </label>
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
        </div>

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

      <div className={`mt-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>To get a Discord webhook URL:</p>
        <ol className="list-decimal list-inside mt-1 space-y-1">
          <li>Go to your Discord server settings</li>
          <li>Click "Integrations" → "Webhooks"</li>
          <li>Create a new webhook and copy the URL</li>
        </ol>
      </div>
    </div>
  );
}

export default UserSettings;