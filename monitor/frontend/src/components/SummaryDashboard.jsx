// src/components/SummaryDashboard.jsx
import React, { useContext, useMemo } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { Globe, CheckCircle, Clock, Zap } from 'lucide-react';

function SummaryDashboard({ websites, statuses, statusesByWebsite = {}, rangeHours = 3 }) {
  const { darkMode } = useContext(ThemeContext);

  const totalWebsites = websites.length;
  const onlineWebsites = websites.filter(w => w.lastStatus === true).length;
  const offlineWebsites = websites.filter(w => w.lastStatus === false).length;
  const unknownWebsites = websites.filter(w => w.lastStatus !== true && w.lastStatus !== false).length;

  // Build latest status map from the provided 'statuses' (latest per site, used as fallback)
  const latestStatusesMap = useMemo(() => {
    const map = new Map();
    (statuses || []).forEach(status => {
      const prev = map.get(status.website_id);
      if (!prev || status.checked_at > prev.checked_at) {
        map.set(status.website_id, status);
      }
    });
    return map;
  }, [statuses]);

  // Time cutoff for the selected window
  const cutoff = useMemo(
    () => Date.now() - rangeHours * 60 * 60 * 1000,
    [rangeHours]
  );

  // Compute average and slowest within the time window if we have per-site arrays
  const { avgResponseTime, slowestWebsite, slowestResponseTime } = useMemo(() => {
    let totalMs = 0;
    let count = 0;
    let slowest = null;
    let slowestMs = 0;

    websites.forEach((w) => {
      const arr = statusesByWebsite[w.id] || [];

      // filter to time window and online with ms
      const inWindow = arr.filter(
        (s) =>
          (s?.checked_at * 1000) >= cutoff &&
          s?.is_up &&
          typeof s?.response_time_ms === 'number'
      );

      if (inWindow.length > 0) {
        // average uses the most recent in window
        const latestInWindow = inWindow.reduce((a, b) =>
          a.checked_at > b.checked_at ? a : b
        );
        totalMs += latestInWindow.response_time_ms;
        count += 1;

        // slowest in window for this site
        const localSlowest = inWindow.reduce((a, b) =>
          a.response_time_ms > b.response_time_ms ? a : b
        );
        if (localSlowest.response_time_ms > slowestMs) {
          slowestMs = localSlowest.response_time_ms;
          slowest = w;
        }
      } else {
        // Fallback: use latestStatusesMap when no data in window
        const latest = latestStatusesMap.get(w.id);
        if (latest?.is_up && typeof latest?.response_time_ms === 'number') {
          totalMs += latest.response_time_ms;
          count += 1;

          if (latest.response_time_ms > slowestMs) {
            slowestMs = latest.response_time_ms;
            slowest = w;
          }
        }
      }
    });

    return {
      avgResponseTime: count > 0 ? Math.round(totalMs / count) : 0,
      slowestWebsite: slowest,
      slowestResponseTime: slowestMs
    };
  }, [websites, statusesByWebsite, latestStatusesMap, cutoff]);

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-xl p-6 mb-6 transition-colors duration-200`}>
      <h2 className="text-2xl font-bold mb-6 text-center">System Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Websites */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-100'} transition-colors duration-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Websites</p>
              <p className="text-3xl font-extrabold mt-1">{totalWebsites}</p>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-blue-100'}`}>
              <Globe className={`h-7 w-7 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
          </div>
        </div>

        {/* Online vs Offline */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-100'} transition-colors duration-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Online</p>
              <p className="text-3xl font-extrabold mt-1 text-green-500">
                {onlineWebsites} <span className="text-lg font-normal">of {totalWebsites}</span>
              </p>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-green-100'}`}>
              <CheckCircle className={`h-7 w-7 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className={`${darkMode ? 'text-red-400' : 'text-red-500'} font-medium`}>Offline: {offlineWebsites}</span>
            <span className={`${darkMode ? 'text-yellow-400' : 'text-yellow-500'} font-medium`}>Unknown: {unknownWebsites}</span>
          </div>
        </div>

        {/* Average Response Time */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-purple-50 border-purple-100'} transition-colors duration-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Avg Response Time</p>
              <p className="text-3xl font-extrabold mt-1">{avgResponseTime}<span className="text-lg font-normal ml-1">ms</span></p>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-purple-100'}`}>
              <Clock className={`h-7 w-7 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
            </div>
          </div>
        </div>

        {/* Slowest Website */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-yellow-50 border-yellow-100'} transition-colors duration-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Slowest Website</p>
              <p className="text-lg font-extrabold mt-1 truncate max-w-[140px]">
                {slowestWebsite ? slowestWebsite.name : 'N/A'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-yellow-100'}`}>
              <Zap className={`h-7 w-7 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
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
