import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function WebsiteList({ websites, selectedWebsite, onSelect }) {
  const { darkMode } = useContext(ThemeContext);

  // Helper function to determine status color
  const getStatusColor = (lastStatus) => {
    if (lastStatus === true) return 'bg-green-500';
    if (lastStatus === false) return 'bg-red-500';
    return 'bg-yellow-500'; // For null, undefined, or any other non-boolean value
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow transition-colors duration-200`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold">Monitored Websites ({websites.length})</h2>
      </div>
      
      <div className="overflow-y-auto max-h-[500px]">
        {websites.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {websites.map((website) => (
              <li 
                key={website.id}
                onClick={() => onSelect(website)}
                className={`p-4 cursor-pointer transition-colors duration-150
                  ${selectedWebsite && selectedWebsite.id === website.id
                    ? darkMode
                      ? 'bg-gray-700'
                      : 'bg-blue-50'
                    : darkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      selectedWebsite && selectedWebsite.id === website.id
                        ? darkMode ? 'text-blue-400' : 'text-blue-600'
                        : darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {website.name}
                    </p>
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {website.url}
                    </p>
                  </div>
                  <div 
                    className={`h-3 w-3 rounded-full ml-2 ${getStatusColor(website.lastStatus)}`}
                    title={
                      website.lastStatus === true ? 'Online' : 
                      website.lastStatus === false ? 'Offline' : 
                      'Unknown'
                    }
                  ></div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No websites found
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs">
        <span className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span> Online
        </span>
        <span className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-red-500 mr-1"></span> Offline
        </span>
        <span className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></span> Unknown
        </span>
      </div>
    </div>
  );
}

export default WebsiteList; 