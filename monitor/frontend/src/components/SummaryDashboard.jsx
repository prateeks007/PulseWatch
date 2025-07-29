import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
// --- NEW IMPORTS: Lucide React Icons ---
import { Globe, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
// --- END NEW IMPORTS ---

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
  
  // To calculate average and slowest, we need the *latest* status for each website.
  // This logic assumes `websites` prop already contains `lastStatus` correctly from App.jsx
  // If `statuses` prop is meant to be *all* statuses, this needs adjustment.
  // For now, relying on `website.lastStatus` for online/offline and finding latest for response time.
  const latestStatusesMap = new Map();
  statuses.forEach(status => {
    if (!latestStatusesMap.has(status.website_id) || status.checked_at > latestStatusesMap.get(status.website_id).checked_at) {
      latestStatusesMap.set(status.website_id, status);
    }
  });


  websites.forEach(website => {
    const latestStatusForWebsite = latestStatusesMap.get(website.id);
    if (latestStatusForWebsite && latestStatusForWebsite.is_up && latestStatusForWebsite.response_time_ms) {
      totalResponseTime += latestStatusForWebsite.response_time_ms;
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
    const latestStatusForWebsite = latestStatusesMap.get(website.id);
    if (latestStatusForWebsite && latestStatusForWebsite.is_up && latestStatusForWebsite.response_time_ms > slowestResponseTime) {
      slowestResponseTime = latestStatusForWebsite.response_time_ms;
      slowestWebsite = website;
    }
  });

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-xl p-6 mb-6 transition-colors duration-200`}>
      <h2 className="text-2xl font-bold mb-6 text-center">System Overview</h2> {/* Larger, centered title */}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Increased gap */}
        {/* Total Websites Card */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-100'} transition-colors duration-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Websites</p>
              <p className="text-3xl font-extrabold mt-1">{totalWebsites}</p> {/* Larger, bolder number */}
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-blue-100'}`}>
              <Globe className={`h-7 w-7 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} /> {/* Lucide Icon */}
            </div>
          </div>
        </div>
        
        {/* Online vs Offline Card */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-100'} transition-colors duration-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Online</p>
              <p className="text-3xl font-extrabold mt-1 text-green-500">{onlineWebsites} <span className="text-lg font-normal">of {totalWebsites}</span></p>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-green-100'}`}>
              <CheckCircle className={`h-7 w-7 ${darkMode ? 'text-green-400' : 'text-green-500'}`} /> {/* Lucide Icon */}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className={`${darkMode ? 'text-red-400' : 'text-red-500'} font-medium`}>Offline: {offlineWebsites}</span>
            <span className={`${darkMode ? 'text-yellow-400' : 'text-yellow-500'} font-medium`}>Unknown: {unknownWebsites}</span>
          </div>
        </div>
        
        {/* Average Response Time Card */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-purple-50 border-purple-100'} transition-colors duration-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Avg Response Time</p>
              <p className="text-3xl font-extrabold mt-1">{avgResponseTime}<span className="text-lg font-normal ml-1">ms</span></p>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-purple-100'}`}>
              <Clock className={`h-7 w-7 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} /> {/* Lucide Icon */}
            </div>
          </div>
        </div>
        
        {/* Slowest Website Card */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-yellow-50 border-yellow-100'} transition-colors duration-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Slowest Website</p>
              <p className="text-lg font-extrabold mt-1 truncate max-w-[140px]">
                {slowestWebsite ? slowestWebsite.name : 'N/A'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-yellow-100'}`}>
              <Zap className={`h-7 w-7 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} /> {/* Lucide Icon */}
            </div>
          </div>
          <div className="mt-3 text-sm">
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
              {slowestResponseTime > 0 ? `${slowestResponseTime} ms` : 'No data'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SummaryDashboard;