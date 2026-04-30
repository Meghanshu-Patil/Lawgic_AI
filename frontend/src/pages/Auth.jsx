import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Moon, Sun } from 'lucide-react';
import './Auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  React.useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode);
      if (newMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      return newMode;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin
      ? { email, password }
      : { fullname: { firstName, lastName }, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // If successful, the backend sets an HttpOnly cookie or standard cookie.
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // We can just navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-split-left">
        <div className="auth-branding">
          <Scale size={64} className="auth-icon" />
          <h1>Lawgic AI</h1>
          <p className="auth-subtitle">Your Legal Counsel & Document Analysis Assistant</p>
        </div>
      </div>

      <div className="auth-split-right">
        <button className="auth-theme-toggle" onClick={toggleDarkMode} title="Toggle Dark Mode">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="auth-form-wrapper glass-panel">
          <h2>{isLogin ? 'Enter the Chambers' : 'Register your Counsel'}</h2>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    className="input-formal"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    className="input-formal"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="input-formal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="input-formal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary auth-submit">
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <p className="auth-toggle">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button className="auth-toggle-btn" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Register Here' : 'Login Here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
