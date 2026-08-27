import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminCompetitions from './pages/AdminCompetitions'
import AdminRegistrations from './pages/AdminRegistrations'
import StudentLogin from './pages/StudentLogin'
import StudentRegister from './pages/StudentRegister'
import StudentProfile from './pages/StudentProfile'
import Competitions from './pages/Competitions'
import CompetitionDetail from './pages/CompetitionDetail'
import AuthCallback from './pages/AuthCallback'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<StudentLogin />} />
      <Route path="/register" element={<StudentRegister />} />
      <Route path="/profile" element={<StudentProfile />} />
      <Route path="/competitions" element={<Competitions />} />
      <Route path="/competitions/:id" element={<CompetitionDetail />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/competitions" element={<AdminCompetitions />} />
      <Route path="/admin/registrations" element={<AdminRegistrations />} />
    </Routes>
  )
}

export default App
