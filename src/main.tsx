import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PostHogProvider } from './context/PostHogContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import './themes/themes.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PostHogProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </PostHogProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
