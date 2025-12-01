import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const MiniChart = ({ data, height = 40, width = 120 }) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded"
        style={{ height, width }}
      >
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }

  // Get recent data points
  const recentData = data.slice(-30);
  
  // Check if website is currently offline (no recent online data)
  const hasRecentOnlineData = recentData.some(item => item.is_up === true);
  
  if (!hasRecentOnlineData) {
    return (
      <div 
        className="flex items-center justify-center bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
        style={{ height, width }}
      >
        <span className="text-xs text-red-600 dark:text-red-400 font-medium">Offline</span>
      </div>
    );
  }

  // Transform data for chart (only online data points)
  const chartData = recentData
    .filter(item => item.is_up && typeof item.response_time_ms === 'number')
    .map((item, index) => ({
      index,
      value: item.response_time_ms,
      time: item.checked_at
    }));

  // This shouldn't happen now, but keep as fallback
  if (chartData.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded"
        style={{ height, width }}
      >
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }

  // Calculate average for color coding
  const avgResponseTime = chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length;
  
  // Color based on average response time
  const getLineColor = () => {
    if (avgResponseTime <= 200) return '#10b981'; // green-500 (fast)
    if (avgResponseTime <= 500) return '#f59e0b'; // amber-500 (medium)
    return '#ef4444'; // red-500 (slow)
  };

  // Background color for chart area
  const getBackgroundColor = () => {
    if (avgResponseTime <= 200) return 'bg-green-50 dark:bg-green-900/10';
    if (avgResponseTime <= 500) return 'bg-amber-50 dark:bg-amber-900/10';
    return 'bg-red-50 dark:bg-red-900/10';
  };

  return (
    <div 
      className={`rounded border ${getBackgroundColor()}`}
      style={{ height, width }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={getLineColor()}
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniChart;