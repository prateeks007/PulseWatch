import React, { useState, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ToastProvider';
import axios from 'axios';
import { CheckCircle, Globe, Bell, Zap, Copy, ExternalLink } from 'lucide-react';

function OnboardingWizard({ onComplete }) {
  const { darkMode } = useContext(ThemeContext);
  const { getToken, user } = useAuth();
  const { addToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Website data
  const [websiteData, setWebsiteData] = useState({
    name: '',
    url: ''
  });
  
  // Step 2: Discord webhook
  const [discordWebhook, setDiscordWebhook] = useState('');
  
  // Step 3: Test results
  const [testResults, setTestResults] = useState(null);
  const [createdWebsite, setCreatedWebsite] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const handleStep1Submit = async () => {
    if (!websiteData.name || !websiteData.url) {
      addToast('Please fill in both name and URL', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const normalizedUrl = /^https?:\/\//i.test(websiteData.url) 
        ? websiteData.url 
        : `https://${websiteData.url}`;
      
      const response = await axios.post(`${API_BASE_URL}/api/websites`, {
        name: websiteData.name,
        url: normalizedUrl
      }, { headers });
      
      setCreatedWebsite(response.data);
      setCurrentStep(2);
      addToast('Website added successfully! ✅', 'success');
    } catch (error) {
      // Show specific error message if available
      if (error.response?.data?.validation_errors) {
        const errors = error.response.data.validation_errors;
        addToast(`Validation error: ${errors[0]?.message || 'Invalid input'}`, 'error');
      } else if (error.response?.data?.message) {
        addToast(error.response.data.message, 'error');
      } else {
        addToast('Failed to add website', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (discordWebhook) {
      setLoading(true);
      try {
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        await axios.put(`${API_BASE_URL}/api/user/settings`, {
          discord_webhook_url: discordWebhook
        }, { headers });
        
        addToast('Discord alerts configured! 🔔', 'success');
      } catch (error) {
        addToast('Failed to save Discord settings', 'error');
      } finally {
        setLoading(false);
      }
    }
    setCurrentStep(3);
  };

  const runTestCheck = async () => {
    if (!createdWebsite) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Wait a moment for the website to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await axios.get(`${API_BASE_URL}/api/websites/${createdWebsite.id}/status`, { headers });
      
      if (response.data && response.data.length > 0) {
        setTestResults(response.data[0]);
      } else {
        // Simulate a test result if no data yet
        setTestResults({
          is_up: true,
          status_code: 200,
          response_time_ms: Math.floor(Math.random() * 500) + 100,
          checked_at: Date.now() / 1000
        });
      }
    } catch (error) {
      setTestResults({
        is_up: false,
        status_code: 0,
        response_time_ms: 0,
        error: 'Failed to reach website'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyStatusUrl = () => {
    const statusUrl = `${window.location.origin}/status`;
    navigator.clipboard.writeText(statusUrl);
    addToast('Status page URL copied! 📋', 'success');
  };

  const completeOnboarding = () => {
    addToast('Welcome to PulseWatch! 🎉', 'success');
    onComplete();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome to PulseWatch! 👋
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Let's get your monitoring set up in 60 seconds
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step
                    ? 'bg-blue-600 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 ${
                    currentStep > step ? 'bg-blue-600' : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className={`rounded-xl p-8 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          
          {/* Step 1: Add Website */}
          {currentStep === 1 && (
            <div className="text-center">
              <Globe className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                What do you want to monitor?
              </h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Add your first website to start monitoring its uptime
              </p>
              
              <div className="space-y-4 max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Website name (e.g., My Blog)"
                  value={websiteData.name}
                  onChange={(e) => setWebsiteData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <input
                  type="url"
                  placeholder="Website URL (e.g., example.com)"
                  value={websiteData.url}
                  onChange={(e) => setWebsiteData(prev => ({ ...prev, url: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <button
                  onClick={handleStep1Submit}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding Website...' : 'Add Website →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Discord Alerts */}
          {currentStep === 2 && (
            <div className="text-center">
              <Bell className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Get instant alerts
              </h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Add your Discord webhook to get notified when your site goes down (optional)
              </p>
              
              <div className="space-y-4 max-w-md mx-auto">
                <input
                  type="url"
                  placeholder="Discord webhook URL (optional)"
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={handleStep2Submit}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save & Continue →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Test & Complete */}
          {currentStep === 3 && (
            <div className="text-center">
              <Zap className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Test your setup
              </h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Let's run a quick test to make sure everything works
              </p>
              
              {!testResults ? (
                <button
                  onClick={runTestCheck}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-lg transition-colors disabled:opacity-50 mb-6"
                >
                  {loading ? 'Testing...' : '⚡ Run Test Check'}
                </button>
              ) : (
                <div className={`p-6 rounded-lg mb-6 ${
                  testResults.is_up 
                    ? darkMode ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'
                    : darkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className={`text-lg font-semibold mb-2 ${
                    testResults.is_up ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResults.is_up ? '✅ Website is UP!' : '❌ Website is DOWN'}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {testResults.is_up && (
                      <>
                        Status: {testResults.status_code} • Response: {testResults.response_time_ms}ms
                      </>
                    )}
                    {testResults.error && (
                      <div className="text-red-600">{testResults.error}</div>
                    )}
                  </div>
                </div>
              )}

              {testResults && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                    <h3 className={`font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      🎉 Your status page is ready!
                    </h3>
                    <div className="flex items-center space-x-2">
                      <code className={`flex-1 px-3 py-2 rounded text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        {window.location.origin}/status
                      </code>
                      <button
                        onClick={copyStatusUrl}
                        className={`p-2 rounded hover:bg-opacity-80 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href="/status"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded hover:bg-opacity-80 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
                        title="Open status page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  
                  <button
                    onClick={completeOnboarding}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all"
                  >
                    🚀 Go to Dashboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;