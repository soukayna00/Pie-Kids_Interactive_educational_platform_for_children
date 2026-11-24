import { API_BASE_URL } from '../../apiBase.js';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Allcourses.css';

const API_URL = `${API_BASE_URL}/`;
const lessonArtwork = new Map([
  ['Save for a Goal', 'saving'],
  ['Spend Wisely', 'spending'],
  ['Make a Budget', 'budgeting'],
]);

export default function AllCourses() {
  const [courses, setCourses] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      try {
        const response = await fetch(new URL('cours', API_URL), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Could not load courses');

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Invalid course list');
        if (!controller.signal.aborted) setCourses(data);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }

    loadCourses();
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setFailed(false);
    setAttempt((previous) => previous + 1);
  }

  return (
    <main className="pie-catalog">
      <div className="pie-catalog__inner">
        <header className="pie-catalog__intro">
          <h1>Explore Lessons</h1>
          <p>Practice saving, spending, and budgeting one lesson at a time.</p>
        </header>

        {failed ? (
          <div className="pie-catalog__message">
            <p role="alert">We couldn’t load the lessons.</p>
            <button type="button" className="pie-catalog__action" onClick={retry}>
              Try Again
            </button>
          </div>
        ) : courses === null ? (
          <p className="pie-catalog__message" role="status">Loading lessons…</p>
        ) : courses.length === 0 ? (
          <p className="pie-catalog__message">No lessons are available yet.</p>
        ) : (
          <ul className="pie-catalog__grid" role="list">
            {courses.map((course) => {
              const artwork = lessonArtwork.get(course.titre);

              return (
                <li key={course._id} className="pie-catalog__card">
                  <div className="pie-catalog__art">
                    {artwork ? (
                      <span
                        className={`pie-catalog__sprite pie-catalog__sprite--${artwork}`}
                        aria-hidden="true"
                      />
                    ) : course.Thumbnail && (
                      <img
                        src={new URL(course.Thumbnail.replace(/\\/g, '/'), API_URL).href}
                        alt=""
                        loading="lazy"
                        onError={(event) => { event.currentTarget.hidden = true; }}
                      />
                    )}
                  </div>

                  <div className="pie-catalog__body">
                    <h2>{course.titre}</h2>
                    <p>{course.description}</p>

                    {course.Competences?.some((skill) => skill?.Titre) && (
                      <ul className="pie-catalog__skills" aria-label="Skills">
                        {course.Competences.filter((skill) => skill?.Titre).map((skill) => (
                          <li key={skill._id}>{skill.Titre}</li>
                        ))}
                      </ul>
                    )}

                    <Link
                      className="pie-catalog__action"
                      to={`/enroll/${course._id}`}
                      aria-label={`View Lesson: ${course.titre}`}
                    >
                      View Lesson <span aria-hidden="true">▸</span>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
