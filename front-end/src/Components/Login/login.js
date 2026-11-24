import { API_BASE_URL } from '../../apiBase.js';
import React, { useContext, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import '../Register/Register.css';
import './login.css';

export default function Login() {
  const navigate = useNavigate();
  const { setAuthState } = useContext(AuthContext);
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;

    const credentials = Object.fromEntries(new FormData(event.currentTarget));
    submitting.current = true;
    setPending(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/Etudiants/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Sign-in failed. Please try again.');
        return;
      }

      const { token, id, name, role } = data;
      const destination = role === 'Enseignant' ? '/home' : '/student';
      if (!token || (role !== 'Enseignant' && role !== 'Etudiant')) {
        setError('We couldn’t sign in to this account.');
        return;
      }

      localStorage.setItem('token', token);
      setAuthState({ isAuthenticated: true, id, name, role });
      navigate(destination);
    } catch {
      setError('We couldn’t sign you in. Please try again.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <main className="pie-register pie-login">
      <div className="pie-register__layout">
        <section className="pie-register__panel" aria-labelledby="login-title">
          <div className="pie-register__heading">
            <h1 id="login-title">Welcome Back</h1>
            <img src="/assets/coin.png" alt="" />
          </div>
          <p>Sign in to continue your money lessons.</p>

          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input name="email" type="email" autoComplete="username" required />
            </label>
            <label>
              Password
              <input name="motDePasse" type="password" autoComplete="current-password" required />
            </label>

            {error && <p className="pie-register__error" role="alert">{error}</p>}
            <button type="submit" disabled={pending}>
              {pending ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="pie-register__signin">
            New to PIE KIDZ? <Link to="/register">Create an account</Link>
          </p>
        </section>

        <div className="pie-register__art pie-login__art" aria-hidden="true">
          <img src="/assets/peach.png" alt="" />
        </div>
      </div>
    </main>
  );
}
