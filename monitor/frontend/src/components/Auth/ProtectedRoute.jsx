// src/components/Auth/ProtectedRoute.jsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Activity } from 'lucide-react'

const ProtectedRoute = ({ children }) => {
  // Get authentication state from context
  const { user, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          {/* Animated Loading Spinner */}
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 mx-auto"></div>
            <div className="animate-ping absolute top-0 left-0 right-0 bottom-0 rounded-full h-16 w-16 bg-blue-400 opacity-20 mx-auto"></div>
          </div>
          
          {/* Logo and Loading Text */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Activity className="h-8 w-8 text-blue-400 animate-pulse" />
            <h1 className="text-2xl font-bold text-white">PulseWatch</h1>
          </div>
          
          <p className="text-gray-300 animate-pulse">
            Checking authentication...
          </p>
        </div>
      </div>
    )
  }

  // If user is not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // If user is authenticated, render the protected component
  return children
}

export default ProtectedRoute