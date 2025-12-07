// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Create context for authentication state
const AuthContext = createContext({})

// Custom hook to use auth context
// This allows any component to access user data and auth functions
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// AuthProvider component that wraps the entire app
export const AuthProvider = ({ children }) => {
  // State to store current user data
  const [user, setUser] = useState(null)
  // State to track if we're still checking authentication status
  const [loading, setLoading] = useState(true)
  // State to store current session (includes JWT token)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Get initial session when component mounts
    const getInitialSession = async () => {
      // Get current session from Supabase (checks localStorage)
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
      } else {
        // Set session and user data if session exists
        setSession(session)
        setUser(session?.user ?? null)
      }
      
      // Done loading initial session
      setLoading(false)
    }

    getInitialSession()

    // Listen for authentication state changes
    // This fires when user logs in, logs out, or token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        // Update state with new session data
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Cleanup subscription when component unmounts
    return () => subscription.unsubscribe()
  }, [])

  // Sign up function - creates new user account
  const signUp = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Sign in function - logs in existing user
  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function - logs out current user
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error && error.message !== 'Auth session missing!') {
        throw error
      }
      
      // Clear local state immediately
      setSession(null)
      setUser(null)
      
      // Auth state change will automatically redirect to /auth
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if signOut fails, clear local state
      setSession(null)
      setUser(null)
    }
  }

  // Get current JWT token for API calls
  const getToken = async () => {
    try {
      // Get fresh session (automatically refreshes if needed)
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session?.access_token || null
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  }

  // Values provided to all child components
  const value = {
    user,           // Current user object (null if not logged in)
    session,        // Current session object (includes JWT token)
    loading,        // Boolean: true while checking auth status
    signUp,         // Function to create new account
    signIn,         // Function to log in
    signOut,        // Function to log out
    getToken,       // Function to get JWT token for API calls
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}