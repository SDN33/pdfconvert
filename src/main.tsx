import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import MentionsLegales from './pages/MentionsLegales.tsx';
import Success from './pages/Success.tsx';
import SetupPassword from './pages/SetupPassword.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/success" element={<Success />} />
        <Route path="/setup-password" element={<SetupPassword />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
