import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Landing } from './components/Landing'
import { Room } from './Room'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
