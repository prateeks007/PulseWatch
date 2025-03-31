import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function SummaryDashboard({ websites, statuses }) {
  const { darkMode } = useContext(ThemeContext);

  // Calculate summary statistics
  const totalWebsites = websites.length;
  const onlineWebsites = websites.filter(website => website.lastStatus === true).length;
  const offlineWebsites = websites.filter(website => website.lastStatus === false).length;
  const unknownWebsites = websites.filter(website => website.lastStatus !== true && website.lastStatus !== false).length;
  
  // Calculate average response time from the most recent status for each website
  let totalResponseTime = 0;
  let websitesWithResponseTime = 0;
  
  websites.forEach(website => {
    const latestStatus = statuses.find(status => status.website_id === website.id);
    if (latestStatus && latestStatus.is_up && latestStatus.response_time_ms) {
      totalResponseTime += latestStatus.response_time_ms;
      websitesWithResponseTime++;
    }
  });
  
  const avgResponseTime = websitesWithResponseTime > 0 
    ? Math.round(totalResponseTime / websitesWithResponseTime) 
    : 0;

  // Find the slowest website
  let slowestWebsite = null;
  let slowestResponseTime = 0;
  
  websites.forEach(website => {
    const latestStatus = statuses.find(status => status.website_id === website.id);
    if (latestStatus && latestStatus.is_up && latestStatus.response_time_ms > slowestResponseTime) {
      slowestResponseTime = latestStatus.response_time_ms;
      slowestWebsite = website;
    }
  });

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow p-6 mb-6 transition-colors duration-200`}>
      <h2 className="text-xl font-bold mb-4">System Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Websites */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Websites</p>
              <p className="text-2xl font-bold">{totalWebsites}</p>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-blue-100'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Online vs Offline */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Online</p>
              <p className="text-2xl font-bold">{onlineWebsites} <span className="text-sm font-normal">of {totalWebsites}</span></p>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-green-100'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? 'text-green-400' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className={`${darkMode ? 'text-red-400' : 'text-red-500'}`}>Offline: {offlineWebsites}</span>
            <span className={`${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`}>Unknown: {unknownWebsites}</span>
          </div>
        </div>
        
        {/* Average Response Time */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Avg Response Time</p>
              <p className="text-2xl font-bold">{avgResponseTime}<span className="text-sm font-normal ml-1">ms</span></p>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-purple-100'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Slowest Website */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Slowest Website</p>
              <p className="text-lg font-bold truncate max-w-[140px]">
                {slowestWebsite ? slowestWebsite.name : 'N/A'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-yellow-100'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-sm">
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {slowestResponseTime > 0 ? `${slowestResponseTime} ms` : 'No data'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SummaryDashboard; 