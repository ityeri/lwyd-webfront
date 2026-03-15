import MainPage from '@/pages/MainPage'
import { BrowserRouter, Route, Routes } from 'react-router'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
