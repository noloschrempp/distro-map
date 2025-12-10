import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MapPage from './components/MapPage';

function App() {
  return (
    <BrowserRouter>
      <div className="bg-slate-950 h-screen overflow-hidden flex flex-col">
        <Routes>
          <Route path="/" element={<Navigate to="/map/all" replace />} />
          <Route path="/map" element={<Navigate to="/map/all" replace />} />
          <Route path="/map/:program" element={<MapPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;