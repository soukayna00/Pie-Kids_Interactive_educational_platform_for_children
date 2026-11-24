import { API_BASE_URL } from '../../../apiBase.js';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './courses.css';

export default function Courses() {
  const { authState } = useAuth();
  const { id, isAuthenticated, role } = authState;
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !id || role !== 'Etudiant') return;

    const controller = new AbortController();

    async function loadCourses() {
      try {
        const response = await fetch(`${API_BASE_URL}/cours/mine`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Courses unavailable');
        const enrolled = await response.json();
        if (!controller.signal.aborted) setResult({ id, attempt, enrolled });
      } catch {
        if (!controller.signal.aborted) setResult({ id, attempt, failed: true });
      }
    }

    loadCourses();
    return () => controller.abort();
  }, [id, isAuthenticated, role, attempt]);

  const current = result && result.id === id && result.attempt === attempt ? result : null;

  return (
    <section id="my-courses" className="pie-student__courses" aria-labelledby="my-courses-title">
      <h2 id="my-courses-title">My Courses</h2>

      {!isAuthenticated || !id ? (
        <p><Link to="/login">Sign in</Link> to see your enrolled courses.</p>
      ) : role !== 'Etudiant' ? (
        <p>Sign in with a student account to see your enrolled courses.</p>
      ) : !current ? (
        <p role="status">Loading your courses…</p>
      ) : current.failed ? (
        <div>
          <p role="alert">We couldn’t load your courses.</p>
          <button
            className="pie-student__button"
            type="button"
            onClick={() => setAttempt((previous) => previous + 1)}
          >
            Try Again
          </button>
        </div>
      ) : current.enrolled.length === 0 ? (
        <p>You haven’t enrolled in any courses yet. Choose one from Explore Lessons to get started.</p>
      ) : (
        <ul className="pie-student__list" role="list">
          {current.enrolled.map((course) => (
            <li key={course._id}>
              <h3>{course.titre}</h3>
              <p>{course.description}</p>
              <Link to={`/courses/${course._id}/dashboard`}>Open Course</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
