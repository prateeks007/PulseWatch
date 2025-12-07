import React, { useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';

function ProfileSettings({ websiteCount = 0 }) {
  const { user } = useAuth();
  const { darkMode } = useContext(ThemeContext);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Profile Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <div className={`p-4 rounded-lg border ${
          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Account Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-600 border-gray-500 text-gray-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                } cursor-not-allowed`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed at this time
              </p>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className={`p-4 rounded-lg border ${
          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Account Usage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Free</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Websites</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{websiteCount} / 30</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSettings;