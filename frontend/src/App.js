// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ContentList from './ContentList';
import AddContent from './AddContent';
import FrameCut from './FrameCut';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ContentList />} />
        <Route path="/add" element={<AddContent />} />
        <Route path="/capture" element={<FrameCut />} />
      </Routes>
    </Router>
  );
}

export default App;
