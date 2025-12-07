// src/App.jsx
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import WebsiteList from './components/WebsiteList';
import ThemeToggle from './components/ThemeToggle';
import FilterBar from './components/FilterBar';
import SummaryDashboard from './components/SummaryDashboard';
import WebsiteDetailsCard from './components/WebsiteDetailsCard';
import AddWebsiteModal from './components/AddWebsiteModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import LoadingSkeleton from './components/LoadingSkeleton';
import ErrorBoundary from './components/ErrorBoundary';
import UserSettings from './components/UserSettings';
import OnboardingWizard from './components/OnboardingWizard';
import { ThemeContext } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { useToast } from './components/ToastProvider';
import { debounce } from 'lodash';
import { AlertTriangle, RefreshCw, User, LogOut, Settings, BarChart3 } from 'lucide-react';
import DropdownMenu, { DropdownItem } from './components/DropdownMenu';
import { calculateUptimePercentage } from './utils/uptimeCalculator';

function App() {
  const { darkMode } = useContext(ThemeContext);
  const { user, signOut, getToken } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [latestStatusesAllSites, setLatestStatusesAllSites] = useState([]);
  const [statusesByWebsite, setStatusesByWebsite] = useState({});
  const [previousWebsiteStatuses, setPreviousWebsiteStatuses] = useState({}); // Track previous status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', maxResponseTime: null });
  const [searchTerm, setSearchTerm] = useState(''); // New search state
  const [showSummary, setShowSummary] = useState(false);
  const [rangeHours, setRangeHours] = useState(3);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState(null);

  const [showOnboarding, setShowOnboarding] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const debouncedSetFilters = useCallback(
    debounce((newFilters) => setFilters(newFilters), 300),
    []
  );

  const handleFilterChange = useCallback((newFilters) => {
    debouncedSetFilters(newFilters);
  }, [debouncedSetFilters]);

  // ---------- API helpers ----------
  const fetchWebsites = async () => {
    try {
      // Get JWT token for authentication
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_BASE_URL}/api/websites`, { headers });

      const latestStatuses = [];
      const nextStatusesByWebsite = {};

      const websitesWithStatus = await Promise.all(
        (response.data || []).map(async (website) => {
          try {
            const statusResponse = await axios.get(`${API_BASE_URL}/api/websites/${website.id}/status`, { headers });
            if (statusResponse.data && statusResponse.data.length > 0) {
              const latest = statusResponse.data[0];
              latestStatuses.push(latest);
              const slice = statusResponse.data.slice(0, 120);
              nextStatusesByWebsite[website.id] = slice;

              // Calculate uptime percentage for last 24 hours
              const uptimePercentage = calculateUptimePercentage(slice, 24);

              return {
                ...website,
                lastStatus: latest.is_up,
                last10Statuses: slice.slice(0, 10),
                uptimePercentage,
              };
            }
            nextStatusesByWebsite[website.id] = [];
            return {
              ...website,
              uptimePercentage: 0,
            };
          } catch (err) {
            console.error(`Failed to fetch status for website ${website.id}:`, err);
            nextStatusesByWebsite[website.id] = [];
            return {
              ...website,
              uptimePercentage: 0,
            };
          }
        })
      );

      // Check for status changes and show notifications
      websitesWithStatus.forEach(website => {
        const currentStatus = website.lastStatus;
        const previousStatus = previousWebsiteStatuses[website.id];
        
        // Only show notification if we have a previous status and it changed
        if (previousStatus !== undefined && previousStatus !== currentStatus) {
          if (currentStatus === true && previousStatus === false) {
            // Website came back online
            addToast(`✅ ${website.name} is back online!`, 'success', 5000);
          } else if (currentStatus === false && previousStatus === true) {
            // Website went offline
            addToast(`❌ ${website.name} went offline!`, 'error', 5000);
          }
        }
      });

      // Update previous statuses for next comparison
      const newPreviousStatuses = {};
      websitesWithStatus.forEach(website => {
        newPreviousStatuses[website.id] = website.lastStatus;
      });
      setPreviousWebsiteStatuses(newPreviousStatuses);

      setWebsites(websitesWithStatus);
      setStatusesByWebsite(nextStatusesByWebsite);
      setLatestStatusesAllSites(latestStatuses);
      setLoading(false);

      // Show onboarding for new users with no websites
      if (websitesWithStatus.length === 0) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
        if (!selectedWebsite && websitesWithStatus.length > 0) {
          setSelectedWebsite(websitesWithStatus[0]);
          fetchStatuses(websitesWithStatus[0].id);
        }
      }
    } catch (err) {
      setError('Failed to fetch websites');
      setLoading(false);
      console.error('Error fetching websites:', err);
    }
  };

  const fetchStatuses = async (websiteId) => {
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_BASE_URL}/api/websites/${websiteId}/status`, { headers });
      setStatuses(response.data);
    } catch (err) {
      console.error(`Error fetching statuses for website ${websiteId}:`, err);
    }
  };

  const addWebsite = async ({ name, url }) => {
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const res = await axios.post(`${API_BASE_URL}/api/websites`, { name, url: normalizedUrl }, { headers });
      const created = res.data; // expect { id, name, url, ... }

      addToast('Website added ✅', 'success');

      // Optimistically add to list
      setWebsites((prev) => [
        ...prev,
        { ...created, lastStatus: undefined, last10Statuses: [] },
      ]);

      // Select it & fetch statuses
      setSelectedWebsite(created);
      fetchStatuses(created.id);

      // Refresh full list in background (to pull computed fields)
      fetchWebsites();
    } catch (err) {
      // Check if it's a validation error from backend
      if (err.response?.status === 400 && err.response?.data?.validation_errors) {
        // Let the modal handle validation errors
        throw err;
      } else {
        // Show generic error toast for other errors
        addToast('Failed to add website ❌', 'error');
        throw err;
      }
    }
  };

  const deleteWebsite = async (website) => {
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_BASE_URL}/api/websites/${website.id}`, { headers });
      // Update UI
      setWebsites((prev) => prev.filter((w) => w.id !== website.id));
      setStatusesByWebsite((prev) => {
        const copy = { ...prev };
        delete copy[website.id];
        return copy;
      });
      if (selectedWebsite?.id === website.id) {
        setSelectedWebsite(null);
        setStatuses([]);
      }
      addToast('Website deleted ❌', 'error');
    } catch (err) {
      console.error('Delete website failed:', err);
      addToast('Failed to delete website ❌', 'error');
      throw err;
    }
  };
  // ---------- /API helpers ----------

  useEffect(() => {
    fetchWebsites();
    const interval = setInterval(() => {
      fetchWebsites();
      if (selectedWebsite) {
        fetchStatuses(selectedWebsite.id);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      debouncedSetFilters.cancel();
    };
  }, [selectedWebsite, debouncedSetFilters]);

  const handleWebsiteSelect = (website) => {
    setSelectedWebsite(website);
    fetchStatuses(website.id);
  };

  const filteredWebsites = useMemo(() => {
    let filtered = websites;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((website) => 
        website.name.toLowerCase().includes(searchLower) ||
        website.url.toLowerCase().includes(searchLower)
      );
    }

    // Apply status and response time filters
    if (filters.status !== 'all' || (filters.maxResponseTime && filters.maxResponseTime > 0)) {
      filtered = filtered.filter((website) => {
        if (filters.status !== 'all') {
          if (filters.status === 'online' && website.lastStatus !== true) return false;
          if (filters.status === 'offline' && website.lastStatus !== false) return false;
          if (filters.status === 'unknown' && (website.lastStatus === true || website.lastStatus === false)) return false;
        }

        if (filters.maxResponseTime && filters.maxResponseTime > 0 && statuses.length > 0) {
          const relevantStatus = statuses.find((status) => status.website_id === website.id);
          if (relevantStatus && relevantStatus.response_time_ms > filters.maxResponseTime) {
            return false;
          }
        }

        return true;
      });
    }

    return filtered;
  }, [websites, searchTerm, filters, statuses]);

  useEffect(() => {
    if (filteredWebsites.length === 0) {
      setSelectedWebsite(null);
      setStatuses([]);
    } else if (selectedWebsite && !filteredWebsites.some((w) => w.id === selectedWebsite.id)) {
      setSelectedWebsite(filteredWebsites[0]);
      fetchStatuses(filteredWebsites[0].id);
    } else if (!selectedWebsite && filteredWebsites.length > 0) {
      setSelectedWebsite(filteredWebsites[0]);
      fetchStatuses(filteredWebsites[0].id);
    } else if (selectedWebsite && statuses.length === 0) {
      fetchStatuses(selectedWebsite.id);
    }
  }, [filteredWebsites, selectedWebsite, statuses.length]);

  const toggleSummary = () => setShowSummary(!showSummary);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    fetchWebsites(); // Refresh to show the new website
  };

  // Show onboarding wizard for new users
  if (showOnboarding) {
    return (
      <OnboardingWizard onComplete={handleOnboardingComplete} />
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
      }`}>
        <div className="container mx-auto px-4 py-8">
          <LoadingSkeleton type="dashboard" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchWebsites();
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen transition-colors duration-200 ${
          darkMode
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 animate-gradient-x'
            : 'bg-gradient-to-br from-blue-50 via-white to-blue-100 animate-gradient-x'
        }`}
      >
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md bg-opacity-80">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>PulseWatch</h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Monitor your websites in real-time</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
            {/* Primary Action - Always Visible */}
            <div className="flex items-center space-x-2">
              <span className={`text-xs hidden sm:block ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {websites.length}/30
              </span>
              <button
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  websites.length >= 30
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                onClick={() => websites.length < 30 && setShowAddModal(true)}
                disabled={websites.length >= 30}
                title={websites.length >= 30 ? 'Free accounts limited to 30 websites' : 'Add new website'}
              >
                + Add Website
              </button>
            </div>

            {/* Settings Dropdown */}
            <DropdownMenu trigger={<><Settings className="w-4 h-4" /><span className="hidden sm:inline">Settings</span></>}>
              <DropdownItem 
                onClick={toggleSummary}
                icon={BarChart3}
              >
                {showSummary ? 'Hide Summary' : 'Show Summary'}
              </DropdownItem>
              <DropdownItem 
                onClick={() => navigate('/settings')}
                icon={() => <span className="text-sm">⚙️</span>}
              >
                Preferences
              </DropdownItem>
              <DropdownItem 
                onClick={() => window.open('/status', '_blank')}
                icon={() => <span className="text-sm">📊</span>}
              >
                Status Page
              </DropdownItem>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <DropdownMenu trigger={<><User className="w-4 h-4" /><span className="hidden sm:inline">{user?.email?.split('@')[0] || 'User'}</span></>}>
              <div className={`px-4 py-2 text-xs border-b ${
                darkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
              }`}>
                {user?.email}
              </div>
              <DropdownItem 
                onClick={signOut}
                icon={LogOut}
              >
                Sign Out
              </DropdownItem>
            </DropdownMenu>

            {/* Theme Toggle - Always Visible */}
            <ThemeToggle />
          </div>
        </header>

        {showSummary && (
          <SummaryDashboard
            websites={websites}
            statuses={latestStatusesAllSites}
            statusesByWebsite={statusesByWebsite}
            rangeHours={rangeHours}
          />
        )}

        {websites.length > 1 && (
          <FilterBar filters={filters} setFilters={handleFilterChange} searchTerm={searchTerm} onSearch={setSearchTerm} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <WebsiteList
              websites={filteredWebsites}
              selectedWebsite={selectedWebsite}
              onSelect={handleWebsiteSelect}
              onDelete={(w) => {
                setWebsiteToDelete(w);
                setShowDeleteModal(true);
              }}
              totalCount={websites.length}
              statusesByWebsite={statusesByWebsite}
            />
          </div>

          <div className="md:col-span-3">
            {selectedWebsite && filteredWebsites.length > 0 ? (
              <WebsiteDetailsCard
                website={selectedWebsite}
                statuses={statuses}
                rangeHours={rangeHours}
                onChangeRangeHours={setRangeHours}
              />
            ) : (
              <div
                className={`${
                  darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-500'
                } rounded-lg shadow p-6 flex justify-center items-center h-64`}
              >
                <p>
                  {filteredWebsites.length === 0
                    ? 'No websites match your filters'
                    : 'Select a website to view details'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Website */}
      <AddWebsiteModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (data) => {
          try {
            await addWebsite(data);
            setShowAddModal(false);
          } catch (error) {
            // Only close modal on success, let modal handle validation errors
            if (error.response?.status === 400 && error.response?.data?.validation_errors) {
              // Re-throw validation errors so modal can display them
              throw error;
            }
            // For other errors, toast was already shown in addWebsite
          }
        }}
      />

      {/* Delete Website */}
      <DeleteConfirmModal
        open={showDeleteModal}
        website={websiteToDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setWebsiteToDelete(null);
        }}
        onConfirm={async (w) => {
          try {
            await deleteWebsite(w);
          } finally {
            setShowDeleteModal(false);
            setWebsiteToDelete(null);
          }
        }}
      />
      </div>
    </ErrorBoundary>
  );
}

export default App;
