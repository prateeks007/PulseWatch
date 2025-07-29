// src/components/WebsiteDetailsCard.jsx
import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import StatusChart from './StatusChart';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

function WebsiteDetailsCard({ website, statuses }) {
  const { darkMode } = useContext(ThemeContext);

  const latestStatus = statuses.length > 0 ? statuses[0] : null;
  
  const responseTimes = statuses.filter(s => s.is_up).map(s => s.response_time_ms);
  
  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : null;
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : null;
  const latestResponseTime = latestStatus && latestStatus.is_up ? latestStatus.response_time_ms : null;

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6 transition-colors duration-200`}>
      {/* Header section with website name and URL */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold">
            {website.name}
          </h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            ({website.url})
          </p>
        </div>
        {latestStatus && (
          <div className="flex items-center space-x-2">
            <span className={`h-3 w-3 rounded-full ${
              latestStatus.is_up ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            <p className={`font-medium text-lg ${latestStatus.is_up ? 'text-green-500' : 'text-red-500'}`}>
              {latestStatus.is_up ? 'Online' : 'Offline'}
            </p>
          </div>
        )}
      </div>

      {/* A small dashboard above the chart for key metrics */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center`}>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock size={16} />
            <span>Latest</span>
          </div>
          <p className="text-xl font-bold mt-1">
            {latestResponseTime ? `${latestResponseTime} ms` : 'N/A'}
          </p>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <TrendingDown size={16} />
            <span>Fastest</span>
          </div>
          <p className="text-xl font-bold mt-1">
            {minResponseTime ? `${minResponseTime} ms` : 'N/A'}
          </p>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <TrendingUp size={16} />
            <span>Slowest</span>
          </div>
          <p className="text-xl font-bold mt-1">
            {maxResponseTime ? `${maxResponseTime} ms` : 'N/A'}
          </p>
        </div>
      </div>

      <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Response Time History
      </h3>
      {statuses.length > 0 ? (
        <StatusChart statuses={statuses} />
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No history available for this website.
          </p>
        </div>
      )}
    </div>
  );
}

export default WebsiteDetailsCard;