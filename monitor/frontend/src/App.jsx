// src/App.jsx
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import axios from 'axios';
import WebsiteList from './components/WebsiteList';
import ThemeToggle from './components/ThemeToggle';
import FilterBar from './components/FilterBar';
import SummaryDashboard from './components/SummaryDashboard';
import WebsiteDetailsCard from './components/WebsiteDetailsCard';
import AddWebsiteModal from './components/AddWebsiteModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { ThemeContext } from './context/ThemeContext';
import { useToast } from './components/ToastProvider';
import { debounce } from 'lodash';

function App() {
  const { darkMode } = useContext(ThemeContext);
  const { addToast } = useToast();

  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [latestStatusesAllSites, setLatestStatusesAllSites] = useState([]);
  const [statusesByWebsite, setStatusesByWebsite] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', maxResponseTime: null });
  const [showSummary, setShowSummary] = useState(true);
  const [rangeHours, setRangeHours] = useState(3);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState(null);

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
      const response = await axios.get(`${API_BASE_URL}/api/websites`);

      const latestStatuses = [];
      const nextStatusesByWebsite = {};

      const websitesWithStatus = await Promise.all(
        response.data.map(async (website) => {
          try {
            const statusResponse = await axios.get(`${API_BASE_URL}/api/websites/${website.id}/status`);
            if (statusResponse.data && statusResponse.data.length > 0) {
              const latest = statusResponse.data[0];
              latestStatuses.push(latest);
              const slice = statusResponse.data.slice(0, 120);
              nextStatusesByWebsite[website.id] = slice;

              return {
                ...website,
                lastStatus: latest.is_up,
                last10Statuses: slice.slice(0, 10),
              };
            }
            nextStatusesByWebsite[website.id] = [];
            return website;
          } catch (err) {
            console.error(`Failed to fetch status for website ${website.id}:`, err);
            nextStatusesByWebsite[website.id] = [];
            return website;
          }
        })
      );

      setWebsites(websitesWithStatus);
      setStatusesByWebsite(nextStatusesByWebsite);
      setLatestStatusesAllSites(latestStatuses);
      setLoading(false);

      if (!selectedWebsite && websitesWithStatus.length > 0) {
        setSelectedWebsite(websitesWithStatus[0]);
        fetchStatuses(websitesWithStatus[0].id);
      }
    } catch (err) {
      setError('Failed to fetch websites');
      setLoading(false);
      console.error('Error fetching websites:', err);
    }
  };

  const fetchStatuses = async (websiteId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/websites/${websiteId}/status`);
      setStatuses(response.data);
    } catch (err) {
      console.error(`Error fetching statuses for website ${websiteId}:`, err);
    }
  };

  const addWebsite = async ({ name, url }) => {
    try {
      // Basic normalization: ensure URL has protocol
      const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const res = await axios.post(`${API_BASE_URL}/api/websites`, { name, url: normalizedUrl });
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
      console.error('Add website failed:', err);
      addToast('Failed to add website ❌', 'error');
      throw err;
    }
  };

  const deleteWebsite = async (website) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/websites/${website.id}`);
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
    if (filters.status === 'all' && (filters.maxResponseTime === null || filters.maxResponseTime <= 0)) {
      return websites;
    }

    return websites.filter((website) => {
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
  }, [websites, filters, statuses]);

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

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
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
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Website Monitor Dashboard</h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Monitor your websites in real-time</p>
          </div>
          <div className="flex space-x-4 items-center">
            <button
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              onClick={() => setShowAddModal(true)}
            >
              + Add Website
            </button>
            <button
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'
              }`}
              onClick={toggleSummary}
            >
              {showSummary ? 'Hide Summary' : 'Show Summary'}
            </button>
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

        <FilterBar filters={filters} setFilters={handleFilterChange} />

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
          } catch {
            // toast already shown in addWebsite
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
  );
}

export default App;
