import { Game } from './components/Game'
import { Nav } from './components/Nav'
import { BackgroundAnimation } from './components/BackgroundAnimation'
import './App.css'

function App() {
  return (
    <>
      <BackgroundAnimation />
      <Nav />
      <Game />
    </>
  )
}

export default App
