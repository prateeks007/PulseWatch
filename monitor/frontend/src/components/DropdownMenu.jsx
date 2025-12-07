import React, { useState, useRef, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { ChevronDown } from 'lucide-react';

function DropdownMenu({ trigger, children, align = 'right' }) {
  const { darkMode } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
          darkMode
            ? 'bg-gray-700 hover:bg-gray-600 text-white'
            : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'
        }`}
      >
        {trigger}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-2 w-48 rounded-lg shadow-lg border ${
          align === 'left' ? 'left-0' : 'right-0'
        } ${
          darkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="py-1">
            {React.Children.map(children, (child, index) => (
              <div key={index} onClick={() => setIsOpen(false)}>
                {child}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ onClick, children, icon: Icon }) {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
        darkMode
          ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
    </button>
  );
}

export default DropdownMenu;