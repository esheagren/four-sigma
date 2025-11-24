import { Routes, Route } from 'react-router-dom'
import { Game } from './components/Game'
import { Nav } from './components/Nav'
import { BackgroundAnimation } from './components/BackgroundAnimation'
import { ProfilePage } from './pages/ProfilePage'
import './App.css'

function App() {
  return (
    <>
      <BackgroundAnimation />
      <Nav />
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </>
  )
}

export default App
