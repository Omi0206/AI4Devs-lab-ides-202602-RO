import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { AddCandidatePage } from './components/AddCandidatePage';
import { RecruiterDashboard } from './components/RecruiterDashboard';

export function AppRoutes(): JSX.Element {
  return (
    <>
      <a href="#main-content" className="skip-link visually-hidden-focusable">
        Skip to main content
      </a>
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<RecruiterDashboard />} />
          <Route path="/candidates/new" element={<AddCandidatePage />} />
        </Routes>
      </main>
    </>
  );
}

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
