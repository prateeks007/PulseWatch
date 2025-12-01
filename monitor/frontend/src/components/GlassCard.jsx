import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function GlassCard({ children, className = "", hover = true }) {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className={`
      backdrop-blur-md bg-opacity-20 border border-opacity-30 rounded-xl
      ${darkMode 
        ? 'bg-gray-800 border-gray-600 shadow-2xl' 
        : 'bg-white border-gray-300 shadow-xl'
      }
      ${hover ? 'hover:shadow-2xl hover:-translate-y-1 transition-all duration-300' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

export default GlassCard;