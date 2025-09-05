// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import ContentList from './ContentList';
import ContentDetail from './ContentDetail';
import AddContent from './AddContent';
import FrameCut from './FrameCut';
import SurveyForm from './SurveyForm';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ContentList />} />
          <Route path="add" element={<AddContent />} />
          <Route path="content/:id" element={<ContentDetail />} />
          <Route path="survey/:id" element={<SurveyForm />} />
          <Route path="capture/:id" element={<FrameCut />} />
        </Route>
      </Routes>
    </Router>
  );
}
