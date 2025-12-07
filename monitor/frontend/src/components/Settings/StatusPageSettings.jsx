import React, { useContext } from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

function StatusPageSettings() {
  const { darkMode } = useContext(ThemeContext);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Status Page Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your public status page that customers can view.
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Status Page */}
        <div className={`p-4 rounded-lg border ${
          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Your Status Page
            </h3>
            <button
              onClick={() => window.open('/status', '_blank')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Page
            </button>
          </div>
          
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <code className={`px-2 py-1 rounded text-sm ${
              darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}>
              {window.location.origin}/status
            </code>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Share this URL with your customers to let them check your service status in real-time.
          </p>
        </div>

        {/* Coming Soon Features */}
        <div className={`p-4 rounded-lg border ${
          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Coming Soon
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Custom Domain</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use your own domain for the status page</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`}>
                Soon
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Custom Branding</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add your logo and customize colors</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`}>
                Soon
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Private Status Pages</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Password-protected status pages</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`}>
                Soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatusPageSettings;