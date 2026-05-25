import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, KeyRound, Hash, ShieldAlert, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [regnum, setRegnum] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!regnum.trim() || !password.trim()) {
      setError('Please fill in all credentials fields.');
      return;
    }

    setLoading(true);
    try {
      await login(regnum.trim(), password.trim());
      navigate('/explorer');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 120px)', padding: '2rem 2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div 
        className="glass-panel animate-fade-in" 
        style={{ 
          maxWidth: '450px', 
          width: '100%', 
          padding: '2.5rem', 
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(163, 230, 181, 0.03)' 
        }}
      >
        {/* Header Icon & Title */}
        <div className="flex-center" style={{ flexDirection: 'column', marginBottom: '2rem' }}>
          <div 
            className="flex-center animate-pulse-glow" 
            style={{ 
              background: 'rgba(163, 230, 181, 0.06)', 
              border: '1px solid rgba(163, 230, 181, 0.2)', 
              borderRadius: '16px', 
              padding: '0.75rem',
              marginBottom: '1rem' 
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              width="28" 
              height="28" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-green"
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
          <h2 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '0.25rem' }}>
            Access <span className="text-green">SLS</span> Portal
          </h2>
          <p className="text-muted" style={{ fontSize: '0.8rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            Enter your Swarm credentials to authorize
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div 
            className="flex-center gap-2" 
            style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              borderRadius: '8px', 
              padding: '0.75rem 1rem', 
              marginBottom: '1.5rem',
              color: '#FCA5A5',
              fontSize: '0.85rem'
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex-between" style={{ flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* Registration Number Field */}
          <div style={{ width: '100%' }}>
            <label 
              htmlFor="regnum" 
              className="text-muted" 
              style={{ 
                display: 'block', 
                fontSize: '0.75rem', 
                fontFamily: 'var(--font-mono)', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                marginBottom: '0.5rem' 
              }}
            >
              Registration Number
            </label>
            <div style={{ position: 'relative' }}>
              <Hash 
                size={16} 
                className="text-muted" 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  pointerEvents: 'none' 
                }} 
              />
              <input
                id="regnum"
                type="text"
                className="input-glass"
                placeholder="e.g. 20101234"
                value={regnum}
                onChange={(e) => setRegnum(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ width: '100%' }}>
            <label 
              htmlFor="password" 
              className="text-muted" 
              style={{ 
                display: 'block', 
                fontSize: '0.75rem', 
                fontFamily: 'var(--font-mono)', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                marginBottom: '0.5rem' 
              }}
            >
              Security Password
            </label>
            <div style={{ position: 'relative' }}>
              <KeyRound 
                size={16} 
                className="text-muted" 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  pointerEvents: 'none' 
                }} 
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input-glass"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  outline: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseOver={e => e.currentTarget.style.color = '#fff'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-forge" 
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <span className="flex-center gap-2">
                <span className="status-dot animate-pulse-glow" style={{ width: '6px', height: '6px', backgroundColor: '#000', boxShadow: 'none' }}></span>
                <span>Authorizing Session...</span>
              </span>
            ) : (
              <span className="flex-center gap-2">
                <LogIn size={15} />
                <span>Initialize Core</span>
              </span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <span className="text-muted">New to the collective? </span>
          <Link to="/signup" className="text-green" style={{ textDecoration: 'none', fontWeight: '600' }}>
            Establish Node Profile
          </Link>
        </div>

      </div>
    </div>
  );
}
