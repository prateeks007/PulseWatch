import React from 'react';
import { getUptimeColor } from '../utils/uptimeCalculator';

const UptimeBadge = ({ percentage, size = 'sm', showLabel = false }) => {
  const getBackgroundColor = (percentage) => {
    if (percentage >= 99) return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (percentage >= 95) return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm'
  };

  const getLabel = (percentage) => {
    if (percentage >= 99.5) return 'Excellent';
    if (percentage >= 99) return 'Great';
    if (percentage >= 95) return 'Good';
    if (percentage >= 90) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="flex items-center space-x-2">
      <span 
        className={`
          inline-flex items-center font-semibold rounded-full border
          ${sizeClasses[size]}
          ${getBackgroundColor(percentage)}
          ${getUptimeColor(percentage)}
          transition-all duration-200 hover:scale-105
        `}
      >
        {percentage ? `${percentage}%` : '0%'}
      </span>
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {getLabel(percentage || 0)}
        </span>
      )}
    </div>
  );
};

export default UptimeBadge;