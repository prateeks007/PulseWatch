import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from "./components/ToastProvider";


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
     <ToastProvider>
      <App />
    </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
) 