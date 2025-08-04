// src/App.jsx
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import axios from 'axios';
import WebsiteList from './components/WebsiteList';
import ThemeToggle from './components/ThemeToggle';
import FilterBar from './components/FilterBar';
import SummaryDashboard from './components/SummaryDashboard';
import WebsiteDetailsCard from './components/WebsiteDetailsCard'; // <-- NEW IMPORT
import { ThemeContext } from './context/ThemeContext';
import { debounce } from 'lodash';

function App() {
  const { darkMode } = useContext(ThemeContext);
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    maxResponseTime: null
  });
  const [showSummary, setShowSummary] = useState(true);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
// console.log("Base URL:", import.meta.env.VITE_API_BASE_URL);



  const debouncedSetFilters = useCallback(
    debounce((newFilters) => {
      setFilters(newFilters);
    }, 300),
    []
  );

  const handleFilterChange = useCallback((newFilters) => {
    debouncedSetFilters(newFilters);
  }, [debouncedSetFilters]);

  // Keep your original fetching logic
  const fetchWebsites = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/websites`);
      // console.log("API response:", response.data);

      
      const websitesWithStatus = await Promise.all(
        response.data.map(async (website) => {
          try {
            const statusResponse = await axios.get(`${API_BASE_URL}/api/websites/${website.id}/status`);
            
            if (statusResponse.data && statusResponse.data.length > 0) {
              return {
                ...website,
                lastStatus: statusResponse.data[0].is_up
              };
            }
            return website;
          } catch (err) {
            console.error(`Failed to fetch status for website ${website.id}:`, err);
            return website;
          }
        })
      );
      
      setWebsites(websitesWithStatus);
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

    return websites.filter(website => {
      if (filters.status !== 'all') {
        if (filters.status === 'online' && website.lastStatus !== true) return false;
        if (filters.status === 'offline' && website.lastStatus !== false) return false;
        if (filters.status === 'unknown' && (website.lastStatus === true || website.lastStatus === false)) return false;
      }
      
      if (filters.maxResponseTime && filters.maxResponseTime > 0 && statuses.length > 0) {
        const relevantStatus = statuses.find(status => status.website_id === website.id);
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
    }
    else if (selectedWebsite && !filteredWebsites.some(w => w.id === selectedWebsite.id)) {
      setSelectedWebsite(filteredWebsites[0]);
      fetchStatuses(filteredWebsites[0].id);
    }
    else if (!selectedWebsite && filteredWebsites.length > 0) {
      setSelectedWebsite(filteredWebsites[0]);
      fetchStatuses(filteredWebsites[0].id);
    }
    else if (selectedWebsite && statuses.length === 0) {
      fetchStatuses(selectedWebsite.id);
    }
  }, [filteredWebsites, selectedWebsite, statuses.length]);

  const toggleSummary = () => {
    setShowSummary(!showSummary);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${darkMode ? 'from-gray-900 to-gray-800' : 'from-gray-50 to-gray-100'} transition-colors duration-200`}>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Website Monitor Dashboard</h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Monitor your websites in real-time</p>
          </div>
          <div className="flex space-x-4 items-center">
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
          <SummaryDashboard websites={websites} statuses={statuses} />
        )}

        <FilterBar filters={filters} setFilters={handleFilterChange} />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <WebsiteList 
              websites={filteredWebsites}
              selectedWebsite={selectedWebsite}
              onSelect={handleWebsiteSelect}
            />
          </div>

          <div className="md:col-span-3">
            {selectedWebsite && filteredWebsites.length > 0 ? (
              <WebsiteDetailsCard website={selectedWebsite} statuses={statuses} /> // <-- USE NEW COMPONENT
            ) : (
              <div className={`${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-500'} rounded-lg shadow p-6 flex justify-center items-center h-64`}>
                <p>{filteredWebsites.length === 0 ? 'No websites match your filters' : 'Select a website to view details'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;