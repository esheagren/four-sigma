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
      <Nav />
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </AnimationProvider>
  )
}

export default App
