import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import SearchBar from './SearchBar';

function FilterBar({ filters, setFilters, searchTerm, onSearch }) {
  const { darkMode } = useContext(ThemeContext);
  // Explicitly initialize local state from props
  const [localFilters, setLocalFilters] = useState({
    status: filters.status || 'all',
    maxResponseTime: filters.maxResponseTime
  });

  // Update local state when props change
  useEffect(() => {
    console.log("Filters prop changed:", filters); // Debug logging
    setLocalFilters({
      status: filters.status || 'all',
      maxResponseTime: filters.maxResponseTime
    });
  }, [filters]);

  // Wait a bit before applying filters to allow state updates to propagate
  const applyFilters = (newFilters) => {
    console.log("Applying filters:", newFilters);
    setLocalFilters(newFilters);
    // Small timeout to avoid state update race conditions
    setTimeout(() => {
      setFilters(newFilters);
    }, 50);
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    console.log("Status changed to:", newStatus); // Debug logging
    
    const newFilters = { ...localFilters, status: newStatus };
    applyFilters(newFilters);
  };

  const handleResponseTimeChange = (e) => {
    // Handle empty string and parse value safely
    const value = e.target.value.trim() === '' ? null : parseInt(e.target.value);
    
    // Do not update if value is NaN or negative
    if (value !== null && (isNaN(value) || value < 0)) {
      return;
    }
    
    console.log("Response time changed to:", value); // Debug logging
    const newFilters = { ...localFilters, maxResponseTime: value };
    applyFilters(newFilters);
  };

  const clearFilters = () => {
    console.log("Clearing all filters"); // Debug logging
    const resetFilters = { status: 'all', maxResponseTime: null };
    applyFilters(resetFilters);
  };

  const hasActiveFilters = 
    localFilters.status !== 'all' || 
    (localFilters.maxResponseTime !== null && localFilters.maxResponseTime > 0);

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow p-4 mb-6 transition-colors duration-200`}>
      {/* Search Bar */}
      <SearchBar 
        onSearch={onSearch} 
        placeholder="Search websites by name or URL..." 
      />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label htmlFor="status-filter" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Status
            </label>
            <select
              id="status-filter"
              value={localFilters.status}
              onChange={handleStatusChange}
              className={`block w-full py-2 px-3 border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            >
              <option value="all">All Websites</option>
              <option value="online">Online Only</option>
              <option value="offline">Offline Only</option>
              <option value="unknown">Unknown Status</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="response-time-filter" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Max Response Time (ms)
            </label>
            <input
              id="response-time-filter"
              type="number"
              min="0"
              step="50"
              value={localFilters.maxResponseTime === null ? '' : localFilters.maxResponseTime}
              onChange={handleResponseTimeChange}
              placeholder="Any"
              className={`block w-full py-2 px-3 border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            />
          </div>
        </div>
        
        <div className="mt-2 sm:mt-0">
          <button
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={`py-2 px-4 ${
              !hasActiveFilters
                ? darkMode 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            } rounded-md text-sm font-medium transition-colors duration-200 flex items-center`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Clear Filters
          </button>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'} text-sm`}>
          <p>
            <span className="font-medium">Active filters:</span>{' '}
            {localFilters.status !== 'all' && (
              <span className="mr-2">Status: <span className="font-medium">{localFilters.status}</span></span>
            )}
            {localFilters.maxResponseTime !== null && localFilters.maxResponseTime > 0 && (
              <span>Response time: <span className="font-medium">≤ {localFilters.maxResponseTime}ms</span></span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default FilterBar; 