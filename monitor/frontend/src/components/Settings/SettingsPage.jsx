import React, { useState, useContext, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SettingsSidebar from './SettingsSidebar';
import NotificationsSettings from './NotificationsSettings';
import ProfileSettings from './ProfileSettings';
import StatusPageSettings from './StatusPageSettings';

function SettingsPage() {
  const { darkMode } = useContext(ThemeContext);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('notifications');
  const [websiteCount, setWebsiteCount] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchWebsiteCount = async () => {
      try {
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_BASE_URL}/api/websites`, { headers });
        setWebsiteCount(response.data?.length || 0);
      } catch (err) {
        console.error('Failed to fetch website count:', err);
      }
    };
    fetchWebsiteCount();
  }, [getToken, API_BASE_URL]);

  const renderContent = () => {
    switch (activeSection) {
      case 'notifications':
        return <NotificationsSettings />;
      case 'profile':
        return <ProfileSettings websiteCount={websiteCount} />;
      case 'status-page':
        return <StatusPageSettings />;
      default:
        return <NotificationsSettings />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Settings
              </h1>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Manage your account and preferences
              </p>
            </div>
          </div>
        </header>

        {/* Settings Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SettingsSidebar 
              activeSection={activeSection} 
              onSectionChange={setActiveSection} 
            />
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className={`${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-lg shadow-lg border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            } p-6`}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;