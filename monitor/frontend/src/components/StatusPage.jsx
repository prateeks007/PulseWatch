import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Clock, AlertTriangle, Moon, Sun, Zap, Activity, Shield, BarChart3 } from 'lucide-react';

function StatusPage() {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('statusPageDarkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchStatusData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatusData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('statusPageDarkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const fetchStatusData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/public/status`);
      setStatusData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load status data');
      setLoading(false);
    }
  };

  const fetchServiceHistory = async (serviceId) => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/public/status/${serviceId}`);
      setServiceHistory(response.data.slice(0, 24)); // Last 24 hours
    } catch (err) {
      console.error('Failed to fetch service history:', err);
      setServiceHistory([]);
    }
    setHistoryLoading(false);
  };

  const openServiceDetail = (service) => {
    setSelectedService(service);
    fetchServiceHistory(service.id);
  };

  const closeServiceDetail = () => {
    setSelectedService(null);
    setServiceHistory([]);
  };

  const getStatusColor = (isUp) => {
    if (isUp === null || isUp === undefined) return 'text-gray-500';
    return isUp ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (isUp) => {
    if (isUp === null || isUp === undefined) return <Clock className="h-5 w-5" />;
    return isUp ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />;
  };

  const getStatusText = (isUp) => {
    if (isUp === null || isUp === undefined) return 'Unknown';
    return isUp ? 'Operational' : 'Down';
  };

  const formatUptime = (uptime) => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatLastChecked = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
          : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
      }`}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 mx-auto"></div>
            <div className="animate-ping absolute top-0 left-0 right-0 bottom-0 rounded-full h-16 w-16 bg-blue-400 opacity-20 mx-auto"></div>
          </div>
          <p className={`mt-6 text-lg font-medium animate-pulse ${
            darkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>Loading status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
          : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
      }`}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto animate-bounce" />
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
        </div>
      </div>
    );
  }

  const { overall_status, services } = statusData;

  return (
    <div className={`min-h-screen transition-all duration-500 relative overflow-hidden ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 animate-pulse ${
          darkMode ? 'bg-blue-500' : 'bg-blue-200'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 animate-bounce ${
          darkMode ? 'bg-purple-500' : 'bg-purple-200'
        }`} style={{animationDuration: '3s'}}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5 animate-spin ${
          darkMode ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-gradient-to-r from-blue-300 to-purple-300'
        }`} style={{animationDuration: '20s'}}></div>
      </div>

      {/* Header */}
      <div className={`backdrop-blur-md bg-opacity-80 shadow-xl transition-all duration-500 relative z-10 ${
        darkMode ? 'bg-gray-800/80 border-b border-gray-700/50' : 'bg-white/80 border-b border-gray-200/50'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-2xl shadow-lg transform hover:scale-110 transition-all duration-300 ${
                darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}>
                <Activity className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PulseWatch Status
                </h1>
                <p className={`mt-2 flex items-center space-x-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <Zap className="h-4 w-4" />
                  <span>Real-time monitoring dashboard</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleDarkMode}
                className={`p-3 rounded-2xl shadow-lg transform hover:scale-110 hover:rotate-12 transition-all duration-300 ${
                  darkMode
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-yellow-400/25'
                    : 'bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:shadow-gray-500/25'
                } hover:shadow-2xl`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? 
                  <Sun className="h-6 w-6 animate-spin" style={{animationDuration: '3s'}} /> : 
                  <Moon className="h-6 w-6 animate-pulse" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Overall Status */}
        <div className={`rounded-3xl shadow-2xl border p-8 mb-8 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-3xl backdrop-blur-sm relative overflow-hidden ${
          darkMode ? 'bg-gray-800/80 border-gray-700/50 hover:shadow-blue-500/10' : 'bg-white/80 border-gray-200/50 hover:shadow-blue-500/10'
        }`}>
          {/* Animated border gradient */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-20 animate-pulse"></div>
          <div className={`absolute inset-[1px] rounded-3xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-2xl shadow-lg transform hover:scale-110 transition-all duration-300 ${
                  overall_status.all_up 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse' 
                    : 'bg-gradient-to-r from-red-400 to-pink-500 animate-bounce'
                }`}>
                  {overall_status.all_up ? (
                    <CheckCircle className="h-8 w-8 text-white" />
                  ) : (
                    <XCircle className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className={`text-2xl font-bold bg-gradient-to-r ${
                    overall_status.all_up 
                      ? 'from-green-600 to-emerald-600' 
                      : 'from-red-600 to-pink-600'
                  } bg-clip-text text-transparent`}>
                    {overall_status.all_up ? '🚀 All Systems Operational' : '⚠️ Some Systems Down'}
                  </h2>
                  <p className={`flex items-center space-x-2 mt-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span>Last updated: {formatLastChecked(overall_status.updated_at)}</span>
                  </p>
                </div>
              </div>
              <div className={`px-6 py-3 rounded-2xl text-sm font-bold shadow-lg transform hover:scale-105 transition-all duration-300 ${
                overall_status.all_up 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-bounce'
              }`}>
                {overall_status.status.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-6">
          <h3 className={`text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
            Services
          </h3>
          
          {services.map((service) => (
            <div 
              key={service.id} 
              onClick={() => openServiceDetail(service)}
              className={`rounded-2xl shadow-xl border p-6 transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 backdrop-blur-sm relative overflow-hidden group cursor-pointer ${
                darkMode ? 'bg-gray-800/80 border-gray-700/50 hover:shadow-2xl hover:shadow-blue-500/10' : 'bg-white/80 border-gray-200/50 hover:shadow-2xl hover:shadow-blue-500/10'
              }`}>
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl shadow-md transform group-hover:scale-110 transition-all duration-300 ${
                      service.is_up === true 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse' 
                        : service.is_up === false 
                        ? 'bg-gradient-to-r from-red-400 to-pink-500 animate-bounce' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}>
                      <div className="text-white">
                        {getStatusIcon(service.is_up)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold text-lg group-hover:text-blue-600 transition-colors duration-300 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>{service.name}</h4>
                      <p className={`text-sm flex items-center space-x-1 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <Shield className="h-3 w-3" />
                        <span>{service.url}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-8">
                    {/* Response Time */}
                    {service.response_time && (
                      <div className="text-center transform group-hover:scale-110 transition-all duration-300">
                        <div className={`text-lg font-bold bg-gradient-to-r ${
                          service.response_time < 200 ? 'from-green-500 to-emerald-500' :
                          service.response_time < 500 ? 'from-yellow-500 to-orange-500' :
                          'from-red-500 to-pink-500'
                        } bg-clip-text text-transparent`}>{service.response_time}ms</div>
                        <p className={`text-xs font-medium ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Response Time</p>
                      </div>
                    )}
                    
                    {/* 24h Uptime */}
                    <div className="text-center transform group-hover:scale-110 transition-all duration-300">
                      <div className={`text-lg font-bold ${
                        service.uptime_24h >= 99 ? 'text-green-500' :
                        service.uptime_24h >= 95 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>{formatUptime(service.uptime_24h)}</div>
                      <p className={`text-xs font-medium ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>24h Uptime</p>
                    </div>
                    
                    {/* 7d Uptime */}
                    <div className="text-center transform group-hover:scale-110 transition-all duration-300">
                      <div className={`text-lg font-bold ${
                        service.uptime_7d >= 99 ? 'text-green-500' :
                        service.uptime_7d >= 95 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>{formatUptime(service.uptime_7d)}</div>
                      <p className={`text-xs font-medium ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>7d Uptime</p>
                    </div>
                    
                    {/* Status */}
                    <div className="text-center transform group-hover:scale-110 transition-all duration-300">
                      <div className={`px-4 py-2 rounded-xl font-bold text-sm shadow-md ${
                        service.is_up === true 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse' 
                          : service.is_up === false 
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' 
                          : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                      }`}>
                        {getStatusText(service.is_up)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Last Checked */}
                <div className={`mt-6 pt-4 border-t relative ${
                  darkMode ? 'border-gray-700/50' : 'border-gray-100/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs flex items-center space-x-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <Clock className="h-3 w-3" />
                      <span>Last checked: {formatLastChecked(service.last_checked)}</span>
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${
                            service.is_up ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                          }`} style={{animationDelay: `${i * 0.1}s`}}></div>
                        ))}
                      </div>
                      <BarChart3 className={`h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center relative z-10">
          <div className={`inline-flex items-center space-x-3 px-6 py-3 rounded-2xl backdrop-blur-md shadow-xl ${
            darkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-white/50 text-gray-600'
          }`}>
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="font-medium">Powered by PulseWatch</span>
            <span className="text-xs opacity-75">•</span>
            <span className="text-xs opacity-75">Updates every 30 seconds</span>
            <Zap className="h-4 w-4 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${
                    selectedService.is_up === true 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                      : selectedService.is_up === false 
                      ? 'bg-gradient-to-r from-red-400 to-pink-500' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-500'
                  }`}>
                    <div className="text-white">
                      {getStatusIcon(selectedService.is_up)}
                    </div>
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{selectedService.name}</h2>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>{selectedService.url}</p>
                  </div>
                </div>
                <button
                  onClick={closeServiceDetail}
                  className={`p-2 rounded-xl transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  ✕
                </button>
              </div>

              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                  <p className={`mt-2 text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Loading history...</p>
                </div>
              ) : (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>Last 24 Hours</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {serviceHistory.map((status, index) => (
                      <div key={index} className={`p-4 rounded-xl border ${
                        darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`flex items-center space-x-2`}>
                            <div className={`w-3 h-3 rounded-full ${
                              status.is_up ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-sm font-medium ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>{status.is_up ? 'Up' : 'Down'}</span>
                          </div>
                          <span className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{status.status_code}</span>
                        </div>
                        <div className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <div>Response: {status.response_time_ms}ms</div>
                          <div>{formatLastChecked(status.checked_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {serviceHistory.length === 0 && (
                    <p className={`text-center py-8 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>No history available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusPage;