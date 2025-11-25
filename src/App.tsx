import { Routes, Route } from 'react-router-dom'
import { Game } from './components/Game'
import { Nav } from './components/Nav'
import { BackgroundAnimation } from './components/BackgroundAnimation'
import { ProfilePage } from './pages/ProfilePage'
import { AnimationProvider } from './context/AnimationContext'
import './App.css'

function App() {
  return (
    <AnimationProvider>
      <BackgroundAnimation />
      <Nav />
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </AnimationProvider>
  )
}

export default App
