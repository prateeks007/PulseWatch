import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

const StatusIndicator = ({ status, size = 'sm', showText = false, className = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case true:
      case 'online':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bg: 'bg-green-100 dark:bg-green-900/20',
          text: 'Online',
          pulse: 'animate-pulse-green'
        };
      case false:
      case 'offline':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bg: 'bg-red-100 dark:bg-red-900/20',
          text: 'Offline',
          pulse: 'animate-pulse-red'
        };
      case 'unknown':
        return {
          icon: AlertCircle,
          color: 'text-yellow-500',
          bg: 'bg-yellow-100 dark:bg-yellow-900/20',
          text: 'Unknown',
          pulse: 'animate-pulse-yellow'
        };
      case 'checking':
        return {
          icon: Clock,
          color: 'text-blue-500',
          bg: 'bg-blue-100 dark:bg-blue-900/20',
          text: 'Checking',
          pulse: 'animate-spin'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-400',
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'Unknown',
          pulse: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  if (showText) {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <div className={`p-1 rounded-full ${config.bg}`}>
          <Icon className={`${sizeClasses[size]} ${config.color} ${config.pulse}`} />
        </div>
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <Icon className={`${sizeClasses[size]} ${config.color} ${config.pulse}`} />
    </div>
  );
};

// Dot indicator for compact spaces
export const StatusDot = ({ status, size = 'sm', className = '' }) => {
  const getStatusColor = () => {
    switch (status) {
      case true:
      case 'online':
        return 'bg-green-500 shadow-green-500/50';
      case false:
      case 'offline':
        return 'bg-red-500 shadow-red-500/50';
      case 'unknown':
        return 'bg-yellow-500 shadow-yellow-500/50';
      case 'checking':
        return 'bg-blue-500 shadow-blue-500/50 animate-pulse';
      default:
        return 'bg-gray-400';
    }
  };

  const sizeClasses = {
    xs: 'h-2 w-2',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full ${getStatusColor()} shadow-lg ${className}`}
    />
  );
};

export default StatusIndicator;