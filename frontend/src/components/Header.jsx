import { Link, useLocation } from 'react-router-dom';
import { Network, LogIn, LogOut, UserPlus, Shield, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="main-header">
      <div className="header-container">
        
        {/* LOGO AREA */}
        <Link to="/" className="logo-group">
          <div className="logo-icon-wrapper">
            <svg 
              viewBox="0 0 24 24" 
              width="22" 
              height="22" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="logo-icon animate-pulse-glow"
            >
              <line x1="12" y1="12" x2="6" y2="8" opacity="0.8" />
              <line x1="12" y1="12" x2="18" y2="7" opacity="0.8" />
              <line x1="12" y1="12" x2="5" y2="14" opacity="0.8" />
              <line x1="12" y1="12" x2="19" y2="13" opacity="0.8" />
              <line x1="12" y1="12" x2="9" y2="19" opacity="0.8" />
              <line x1="12" y1="12" x2="16" y2="18" opacity="0.8" />
              
              <line x1="6" y1="8" x2="18" y2="7" opacity="0.3" strokeDasharray="1 1" />
              <line x1="6" y1="8" x2="5" y2="14" opacity="0.4" />
              <line x1="18" y1="7" x2="19" y2="13" opacity="0.4" />
              <line x1="5" y1="14" x2="9" y2="19" opacity="0.4" />
              <line x1="19" y1="13" x2="16" y2="18" opacity="0.4" />
              <line x1="9" y1="19" x2="16" y2="18" opacity="0.3" strokeDasharray="1 1" />

              <circle cx="12" cy="12" r="2.5" fill="var(--color-accent-green)" />
              <circle cx="6" cy="8" r="1.5" fill="currentColor" />
              <circle cx="18" cy="7" r="1.5" fill="currentColor" />
              <circle cx="5" cy="14" r="1.5" fill="currentColor" />
              <circle cx="19" cy="13" r="1.5" fill="currentColor" />
              <circle cx="9" cy="19" r="1.5" fill="currentColor" />
              <circle cx="16" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div className="logo-text-wrapper">
            <span className="logo-title">SLS</span>
            <div className="logo-divider"></div>
            <span className="logo-subtitle">Swarm Learning System</span>
          </div>
        </Link>
 
        {/* STATUS & NAVIGATION */}
        <div className="header-actions">
          <nav className="header-nav" style={{ gap: '0.75rem' }}>

            {isAuthenticated ? (
              <>
                 <div 
                  className="status-indicator animate-fade-in" 
                  style={{ 
                    border: '1px solid rgba(163, 230, 181, 0.15)', 
                    background: 'rgba(163, 230, 181, 0.04)',
                    color: 'var(--color-accent-green)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.8rem',
                    padding: '0.4rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{user.name}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>({user.regnum})</span>
                  {user.role === 'student' && (
                    <span 
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: 'rgba(252, 225, 115, 0.15)',
                        border: '1px solid rgba(252, 225, 115, 0.3)',
                        color: 'var(--color-accent-gold)',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '6px',
                        fontFamily: 'var(--font-mono)',
                        boxShadow: '0 0 10px rgba(252, 225, 115, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      title="Your Contribution Score"
                    >
                      <span style={{ fontSize: '0.8rem', animation: 'pulse-glow 2s infinite ease-in-out' }}>⭐</span>
                      {user.contribution_score || 0}
                    </span>
                  )}
                </div>
                <Link 
                  to="/leaderboard" 
                  className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}
                >
                  <Trophy size={14} />
                  <span>Leaderboard</span>
                </Link>
                {user.role === 'superadmin' && (
                  <Link 
                    to="/admin" 
                    className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                    style={{ 
                      background: 'rgba(255, 165, 0, 0.1)', 
                      borderColor: 'rgba(255, 165, 0, 0.3)',
                      color: '#ffa500'
                    }}
                  >
                    <Shield size={14} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button 
                  onClick={logout} 
                  className="nav-link"
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid transparent', 
                    cursor: 'pointer',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                >
                  <LogIn size={14} />
                  <span>Login</span>
                </Link>
                <Link 
                  to="/signup" 
                  className={`nav-link ${location.pathname === '/signup' ? 'active' : ''}`}
                  style={{ 
                    background: 'rgba(163, 230, 181, 0.08)',
                    borderColor: 'rgba(163, 230, 181, 0.2)',
                    color: 'var(--color-accent-green)' 
                  }}
                >
                  <UserPlus size={14} />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </nav>
        </div>
 
      </div>
    </header>
  );
}
