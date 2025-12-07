import React, { useContext } from 'react';
import { Bell, User, Globe, Shield, CreditCard } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

const sidebarItems = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'status-page', label: 'Status Page', icon: Globe },
  { id: 'security', label: 'Security', icon: Shield, disabled: true },
  { id: 'billing', label: 'Billing', icon: CreditCard, disabled: true },
];

function SettingsSidebar({ activeSection, onSectionChange }) {
  const { darkMode } = useContext(ThemeContext);

  return (
    <div className={`${
      darkMode ? 'bg-gray-800' : 'bg-white'
    } rounded-lg shadow-lg border ${
      darkMode ? 'border-gray-700' : 'border-gray-200'
    } p-4`}>
      <nav className="space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && onSectionChange(item.id)}
              disabled={item.disabled}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                item.disabled
                  ? darkMode 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'text-gray-400 cursor-not-allowed'
                  : isActive
                    ? darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
              {item.disabled && (
                <span className={`ml-auto text-xs px-2 py-1 rounded ${
                  darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                }`}>
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default SettingsSidebar;