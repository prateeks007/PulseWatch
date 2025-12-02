// src/components/Auth/AuthPage.jsx
import React, { useState, useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'
import { Activity, Moon, Sun } from 'lucide-react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

const AuthPage = () => {
  // Get theme context
  const { darkMode, toggleDarkMode } = useContext(ThemeContext)
  
  // State to toggle between login and register
  const [isLogin, setIsLogin] = useState(true)

  // Toggle between login and register forms
  const toggleMode = () => setIsLogin(!isLogin)

  return (
    <div className={`min-h-screen transition-all duration-500 relative overflow-hidden ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 animate-pulse ${
          darkMode ? 'bg-blue-500' : 'bg-blue-200'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 animate-bounce ${
          darkMode ? 'bg-purple-500' : 'bg-purple-200'
        }`} style={{animationDuration: '3s'}}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5 animate-spin ${
          darkMode ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-gradient-to-r from-blue-300 to-purple-300'
        }`} style={{animationDuration: '20s'}}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${
              darkMode ? 'bg-blue-600' : 'bg-blue-500'
            }`}>
              <Activity className="h-6 w-6 text-white animate-pulse" />
            </div>
            <h1 className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              PulseWatch
            </h1>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-xl shadow-lg transform hover:scale-110 transition-all duration-300 ${
              darkMode
                ? 'bg-yellow-500 hover:bg-yellow-400 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <div className="w-full max-w-md">
          {/* Form Container */}
          {isLogin ? (
            <LoginForm onToggleMode={toggleMode} darkMode={darkMode} />
          ) : (
            <RegisterForm onToggleMode={toggleMode} darkMode={darkMode} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-6">
        <p className={`text-sm ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Professional website monitoring platform
        </p>
      </div>
    </div>
  )
}

export default AuthPage