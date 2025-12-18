import { Routes, Route } from 'react-router-dom'
import { Game } from './components/gameplay/Game'
import { Nav } from './components/nav/Nav'
import { BackgroundAnimation } from './components/BackgroundAnimation'
import { ProfilePage } from './pages/ProfilePage'
import { AnimationProvider } from './context/AnimationContext'
import './App.css'

function App() {
  return (
    <AnimationProvider>
      <BackgroundAnimation />
      <div className="app-layout">
        <Nav />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Game />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
      </div>
    </AnimationProvider>
  )
}

export default App
