import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import WelcomeScreen from './components/WelcomeScreen'
import QuestionnaireForm from './components/QuestionnaireForm'
import SuccessScreen from './components/SuccessScreen'
import ScoreChecker from './components/ScoreChecker'
import AdminDashboard from './components/AdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/questionnaire" element={<QuestionnaireForm />} />
        <Route path="/success" element={<SuccessScreen />} />
        <Route path="/score" element={<ScoreChecker />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
