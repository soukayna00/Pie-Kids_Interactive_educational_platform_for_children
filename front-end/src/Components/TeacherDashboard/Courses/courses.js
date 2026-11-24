import { API_BASE_URL } from '../../../apiBase.js';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../Sidebar/sidebar';
import './courses.css';


export default function Courses() {
  const [courses, setCourses] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    axios.get(`${API_BASE_URL}/cours/teaching`, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid course list');
        if (!controller.signal.aborted) setCourses(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => controller.abort();
  }, [attempt]);

  async function handleDelete(course) {
    if (deleting || !window.confirm(`Delete “${course.titre}”?`)) return;

    setDeleting(course._id);
    setDeleteError('');
    try {
      await axios.delete(`${API_BASE_URL}/cours/deleteCourse/${encodeURIComponent(course._id)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setCourses((previous) => previous.filter(({ _id }) => _id !== course._id));
    } catch {
      setDeleteError(`Couldn’t delete “${course.titre}”. Please try again.`);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="pie-teacher-courses">
      <div className="pie-teacher-courses__layout">
        <Sidebar />
        <section aria-labelledby="teacher-courses-title">
          <header className="pie-teacher-courses__header">
            <h1 id="teacher-courses-title">Manage Courses</h1>
            <Link className="pie-teacher-courses__primary" to="/cours/add_course">Create a Course</Link>
          </header>

          {deleteError && <p role="alert">{deleteError}</p>}
          {loadError ? (
            <div>
              <p role="alert">We couldn’t load the courses.</p>
              <button type="button" onClick={() => {
                setLoadError(false);
                setAttempt((previous) => previous + 1);
              }}>Try Again</button>
            </div>
          ) : courses === null ? (
            <p role="status">Loading courses…</p>
          ) : courses.length === 0 ? (
            <p>No courses yet. Select Create a Course to add one.</p>
          ) : (
            <ul className="pie-teacher-courses__grid" role="list">
              {courses.map((course) => (
                <li key={course._id} className="pie-teacher-courses__card">
                  {typeof course.Thumbnail === 'string' && course.Thumbnail && (
                    <img
                      src={`${API_BASE_URL}/${course.Thumbnail.replace(/\\/g, '/').replace(/^\/+/, '')}`}
                      alt=""
                      loading="lazy"
                      onError={(event) => { event.currentTarget.hidden = true; }}
                    />
                  )}
                  <div className="pie-teacher-courses__body">
                    <h2>{course.titre}</h2>
                    <p>{course.description}</p>
                    <div className="pie-teacher-courses__skills">
                      {course.Competences?.filter((skill) => skill?.Titre).map((skill) => (
                        <span key={skill._id}>{skill.Titre}</span>
                      ))}
                    </div>
                    <div className="pie-teacher-courses__actions">
                      <Link to={`/cours/detailCourse/${course._id}`}>View</Link>
                      <Link to={`/cours/editCourse/${course._id}`}>Edit</Link>
                      <button type="button" disabled={deleting !== null} onClick={() => handleDelete(course)}>
                        {deleting === course._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
