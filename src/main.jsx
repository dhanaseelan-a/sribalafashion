import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

// In production, API calls go to Render backend; in dev, Vite proxy handles it
axios.defaults.baseURL = import.meta.env.PROD
    ? 'https://sribalafashion-backend.onrender.com'
    : '';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
