import React from 'react';
import UserSettings from '../UserSettings';

function NotificationsSettings() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Notification Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure how you receive alerts when your websites go up or down.
        </p>
      </div>
      
      <UserSettings />
    </div>
  );
}

export default NotificationsSettings;