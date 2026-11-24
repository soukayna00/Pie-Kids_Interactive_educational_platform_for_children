import { API_BASE_URL } from '../../apiBase.js';
import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;

    const data = Object.fromEntries(new FormData(event.currentTarget));
    submitting.current = true;
    setPending(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/Etudiants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, age: Number(data.age) }),
      });

      if (!response.ok) {
        setError(
          response.status === 400
            ? 'That email is already in use.'
            : 'We couldn’t create your account. Please try again.',
        );
        return;
      }

      navigate('/login', { replace: true });
    } catch {
      setError('We couldn’t reach PIE KIDZ. Please try again.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <main className="pie-register">
      <div className="pie-register__layout">
        <section className="pie-register__panel" aria-labelledby="register-title">
          <div className="pie-register__heading">
            <h1 id="register-title">Join PIE KIDZ</h1>
            <img src="/assets/star.png" alt="" />
          </div>
          <p>Create a learner account to start exploring money lessons.</p>

          <form onSubmit={handleSubmit}>
            <label>
              Your name
              <input name="nom" autoComplete="name" required />
            </label>
            <label>
              Your age
              <input name="age" type="number" min="4" max="18" required />
            </label>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input name="motDePasse" type="password" autoComplete="new-password" required />
            </label>

            {error && <p className="pie-register__error" role="alert">{error}</p>}
            <button type="submit" disabled={pending}>
              {pending ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="pie-register__signin">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </section>

        <div className="pie-register__art" aria-hidden="true">
          <img src="/assets/character-group.png" alt="" />
        </div>
      </div>
    </main>
  );
}
