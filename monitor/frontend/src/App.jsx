import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import axios from 'axios';
import WebsiteList from './components/WebsiteList';
import StatusChart from './components/StatusChart';
import ThemeToggle from './components/ThemeToggle';
import FilterBar from './components/FilterBar';
import SummaryDashboard from './components/SummaryDashboard';
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

  // Optimized setFilters with debounce for response time
  const debouncedSetFilters = useCallback(
    debounce((newFilters) => {
      setFilters(newFilters);
    }, 300),
    []
  );

  const handleFilterChange = useCallback((newFilters) => {
    debouncedSetFilters(newFilters);
  }, [debouncedSetFilters]);

  useEffect(() => {
    // Fetch all websites on component mount
    fetchWebsites();

    // Set up polling every 10 seconds
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

  const fetchWebsites = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/websites');
      
      // Get the latest status for each website to fix the lastStatus issue
      const websitesWithStatus = await Promise.all(
        response.data.map(async (website) => {
          try {
            // Get the latest status for this website
            const statusResponse = await axios.get(`http://localhost:3000/api/websites/${website.id}/status`);
            
            // If we got statuses, use the first one (most recent) to set lastStatus
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

      // Select the first website if none is selected
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
      const response = await axios.get(`http://localhost:3000/api/websites/${websiteId}/status`);
      setStatuses(response.data);
    } catch (err) {
      console.error(`Error fetching statuses for website ${websiteId}:`, err);
    }
  };

  const handleWebsiteSelect = (website) => {
    setSelectedWebsite(website);
    fetchStatuses(website.id);
  };

  // Fix filter logic for accurate status filtering
  const filteredWebsites = useMemo(() => {
    console.log("Current filters:", filters); // Debug logging
    
    // Special case: Return ALL websites when filters are reset to default
    if (filters.status === 'all' && (filters.maxResponseTime === null || filters.maxResponseTime <= 0)) {
      console.log("No active filters, returning all websites"); // Debug logging
      return websites;
    }

    return websites.filter(website => {
      // Filter by status (online/offline/unknown)
      if (filters.status !== 'all') {
        if (filters.status === 'online' && website.lastStatus !== true) return false;
        if (filters.status === 'offline' && website.lastStatus !== false) return false;
        if (filters.status === 'unknown' && (website.lastStatus === true || website.lastStatus === false)) return false;
      }

      // Filter by response time - only if a valid value is provided
      if (filters.maxResponseTime && filters.maxResponseTime > 0 && statuses.length > 0) {
        // Find the status for this website
        const relevantStatus = statuses.find(status => status.website_id === website.id);
        if (relevantStatus && relevantStatus.response_time_ms > filters.maxResponseTime) {
          return false;
        }
      }

      return true;
    });
  }, [websites, filters, statuses]);

  // Reset selected website if it's filtered out
  useEffect(() => {
    // Clear selected website when filtering results in no websites
    if (filteredWebsites.length === 0) {
      setSelectedWebsite(null);
      setStatuses([]);
    }
    // If selected website is filtered out but other options exist, switch to the first available
    else if (selectedWebsite && !filteredWebsites.some(w => w.id === selectedWebsite.id)) {
      setSelectedWebsite(filteredWebsites[0]);
      fetchStatuses(filteredWebsites[0].id);
    }
    // If we currently don't have a selected website but filteredWebsites has websites
    else if (!selectedWebsite && filteredWebsites.length > 0) {
      setSelectedWebsite(filteredWebsites[0]);
      fetchStatuses(filteredWebsites[0].id);
    }
    // If selectedWebsite exists but statuses is empty, fetch them
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
              <>
                <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow p-6 mb-6`}>
                  <h2 className="text-xl font-bold mb-4">
                    {selectedWebsite.name} 
                    <span className={`ml-2 text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({selectedWebsite.url})
                    </span>
                  </h2>
                  
                  {statuses.length > 0 ? (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`h-4 w-4 rounded-full mr-2 ${
                          statuses[0].is_up === true ? 'bg-green-500' : 
                          statuses[0].is_up === false ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <span className="font-medium">
                          {statuses[0].is_up === true ? 'Online' : 
                           statuses[0].is_up === false ? 'Offline' : 'Unknown'}
                        </span>
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Last checked: {statuses[0].checked_at_formatted}
                      </div>
                    </div>
                  ) : (
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No status information available</p>
                  )}
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Response Time History</h3>
                  {statuses.length > 0 ? (
                    <StatusChart statuses={statuses} darkMode={darkMode} />
                  ) : (
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No history available</p>
                  )}
                </div>
              </>
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