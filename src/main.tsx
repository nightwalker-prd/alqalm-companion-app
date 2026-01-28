import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize dark mode before render to prevent flash
const savedDarkMode = localStorage.getItem('madina_dark_mode');
if (savedDarkMode === 'true') {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
