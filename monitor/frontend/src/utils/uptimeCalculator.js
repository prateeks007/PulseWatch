/**
 * Calculate uptime percentage for a website based on its status history
 * @param {Array} statuses - Array of status objects with checked_at and is_up
 * @param {number} hoursBack - How many hours back to calculate (default 24)
 * @returns {number} Uptime percentage (0-100)
 */
export const calculateUptimePercentage = (statuses, hoursBack = 24) => {
  if (!statuses || statuses.length === 0) {
    return 0;
  }

  // Calculate cutoff time (hoursBack ago)
  const cutoffTime = Math.floor(Date.now() / 1000) - (hoursBack * 60 * 60);
  
  // Filter statuses within the time window
  const recentStatuses = statuses.filter(status => 
    status.checked_at && status.checked_at >= cutoffTime
  );

  if (recentStatuses.length === 0) {
    return 0;
  }

  // Count successful checks
  const successfulChecks = recentStatuses.filter(status => status.is_up === true).length;
  
  // Calculate percentage
  const percentage = (successfulChecks / recentStatuses.length) * 100;
  
  // Round to 1 decimal place
  return Math.round(percentage * 10) / 10;
};

/**
 * Get uptime status color based on percentage
 * @param {number} percentage - Uptime percentage
 * @returns {string} Color class for the percentage
 */
export const getUptimeColor = (percentage) => {
  if (percentage >= 99) return 'text-green-500';
  if (percentage >= 95) return 'text-yellow-500';
  return 'text-red-500';
};

/**
 * Get uptime status label
 * @param {number} percentage - Uptime percentage
 * @returns {string} Status label
 */
export const getUptimeLabel = (percentage) => {
  if (percentage >= 99) return 'Excellent';
  if (percentage >= 95) return 'Good';
  if (percentage >= 90) return 'Fair';
  return 'Poor';
};