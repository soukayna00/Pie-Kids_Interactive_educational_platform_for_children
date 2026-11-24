import { API_BASE_URL } from '../../../apiBase.js';
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../Register/Register.css';
import './RegisterEnseignant.css';

export default function RegisterEnseignant() {
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;

    const { nom, email, motDePasse, confirmPassword } = Object.fromEntries(
      new FormData(event.currentTarget),
    );

    if (!nom.trim()) {
      setError('Enter your name.');
      return;
    }
    if (motDePasse !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    submitting.current = true;
    setPending(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/Enseignant/register-enseignant`, {
        nom: nom.trim(),
        email: email.trim(),
        motDePasse,
      });
      setRegistered(true);
    } catch (requestError) {
      setError(requestError.response?.status === 400
        ? 'That email is already in use.'
        : 'We couldn’t create your account. Please try again.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <main className="pie-register pie-teacher-register">
      <div className="pie-register__layout">
        <section className="pie-register__panel" aria-labelledby="teacher-register-title">
          <div className="pie-register__heading">
            <h1 id="teacher-register-title">Join as an Educator</h1>
            <img src="/assets/star.png" alt="" />
          </div>

          {registered ? (
            <p role="status">Your educator account is ready. <Link to="/login">Sign in</Link> to get started.</p>
          ) : (
            <>
              <p>Create an account to teach kids about money.</p>
              <form onSubmit={handleSubmit}>
                <label>
                  Your name
                  <input name="nom" autoComplete="name" required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" autoComplete="email" required />
                </label>
                <label>
                  Password
                  <input name="motDePasse" type="password" autoComplete="new-password" required />
                </label>
                <label>
                  Confirm password
                  <input name="confirmPassword" type="password" autoComplete="new-password" required />
                </label>
                {error && <p className="pie-register__error" role="alert">{error}</p>}
                <button type="submit" disabled={pending}>
                  {pending ? 'Creating account…' : 'Create Educator Account'}
                </button>
              </form>
              <p className="pie-register__signin">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </section>

        <div className="pie-register__art" aria-hidden="true">
          <img src="/assets/mario-shell.png" alt="" />
        </div>
      </div>
    </main>
  );
}
