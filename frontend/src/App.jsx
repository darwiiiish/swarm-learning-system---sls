import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Explorer from './pages/Explorer';
import AlgorithmDetails from './pages/AlgorithmDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import Leaderboard from './pages/Leaderboard';
import Header from './components/Header';
import { AuthProvider, useAuth } from './context/AuthContext';
import SwarmBackground from './components/SwarmBackground';
import './index.css';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-container">
      <SwarmBackground />
      <Header />
      <main style={{ width: '100%' }}>
        <Routes>
          <Route 
            path="/" 
            element={!isAuthenticated ? <Landing /> : <Navigate to="/explorer" />} 
          />
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to="/explorer" />} 
          />
          <Route 
            path="/signup" 
            element={!isAuthenticated ? <Signup /> : <Navigate to="/explorer" />} 
          />
          <Route 
            path="/explorer" 
            element={isAuthenticated ? <Explorer /> : <Navigate to="/" />} 
          />
          <Route 
            path="/algorithm/:slug" 
            element={isAuthenticated ? <AlgorithmDetails /> : <Navigate to="/" />} 
          />
          <Route 
            path="/leaderboard" 
            element={isAuthenticated ? <Leaderboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin" 
            element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/" />} 
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/explorer" : "/"} />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

