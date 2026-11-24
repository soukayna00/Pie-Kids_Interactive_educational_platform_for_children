import { API_BASE_URL } from '../../../apiBase.js';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../../../context/AuthContext';
import './EnRoll.css';


export default function Enroll() {
  const { id } = useParams();
  return <CourseEnrollment key={id} id={id} />;
}

function CourseEnrollment({ id }) {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [course, setCourse] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [pending, setPending] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const studentId = authState.isAuthenticated && authState.role === 'Etudiant' ? authState.id : null;
  const submitting = useRef(false);
  const dashboard = `/courses/${id}/dashboard`;

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourse() {
      try {
        const response = await fetch(`${API_BASE_URL}/cours/${encodeURIComponent(id)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Course not found.' : 'Couldn’t load this course.');
        }
        const data = await response.json();
        if (!controller.signal.aborted) setCourse(data);
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error.message);
      }
    }

    loadCourse();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!studentId) return;

    const controller = new AbortController();
    fetch(`${API_BASE_URL}/cours/mine`, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then((response) => {
      if (!response.ok) throw new Error('Enrollment status unavailable');
      return response.json();
    }).then((courses) => {
      if (!controller.signal.aborted) {
        setEnrollment({ studentId, enrolled: courses.some((item) => item._id === id) });
      }
    }).catch(() => {
      if (!controller.signal.aborted) setEnrollment({ studentId, failed: true });
    });

    return () => controller.abort();
  }, [id, studentId]);

  async function enroll() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setEnrollError('');

    try {
      const response = await fetch(`${API_BASE_URL}/cours/enroller/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Enrollment failed');
      navigate(dashboard);
    } catch {
      setEnrollError('We couldn’t enroll you. Please try again.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  const enrollmentStatus = enrollment?.studentId === studentId ? enrollment : null;
  const enrolled = studentId && enrollmentStatus?.enrolled;
  const chapters = course?.chapitres?.filter(Boolean) ?? [];
  const age = course?.trancheAge;

  return (
    <main className="pie-enroll">
      <div className="pie-enroll__inner">
        <Link to="/courses">← Explore Lessons</Link>

        {loadError ? (
          <p role="alert">{loadError}</p>
        ) : !course ? (
          <p role="status">Loading course…</p>
        ) : (
          <>
            <header className="pie-enroll__hero">
              <div>
                <h1>{course.titre}</h1>
                <p>{course.description}</p>
                {age?.ageMin != null && age?.ageMax != null && (
                  <p className="pie-enroll__age">Ages {age.ageMin}–{age.ageMax}</p>
                )}
                <div className="pie-enroll__actions">
                  {enrolled ? (
                    <Link className="pie-enroll__button" to={dashboard}>Open Course</Link>
                  ) : !authState.isAuthenticated ? (
                    <Link className="pie-enroll__button" to="/login">Sign In to Enroll</Link>
                  ) : studentId && !enrollmentStatus ? (
                    <p role="status">Checking enrollment…</p>
                  ) : studentId ? (
                    <button className="pie-enroll__button" type="button" disabled={pending} onClick={enroll}>
                      {pending ? 'Enrolling…' : 'Enroll in Course'}
                    </button>
                  ) : (
                    <p>A student account is needed to enroll.</p>
                  )}
                  {enrollError && <p role="alert">{enrollError}</p>}
                </div>
              </div>
              {course.Thumbnail && (
                <img src={`${API_BASE_URL}/${course.Thumbnail.replace(/\\/g, '/')}`} alt="" />
              )}
            </header>

            <section aria-labelledby="curriculum-title">
              <h2 id="curriculum-title">Curriculum</h2>
              {chapters.length === 0 && <p>No chapters have been added yet.</p>}
              {chapters.map((chapter) => (
                <details key={chapter._id} className="pie-enroll__chapter">
                  <summary>{chapter.titre}</summary>
                  {chapter.content && (
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(chapter.content) }} />
                  )}
                  {chapter.resources?.length > 0 && (
                    <ul>
                      {chapter.resources.filter((resource) => resource?.filename).map((resource) => (
                        <li key={resource._id ?? resource.filename}>
                          <a href={`${API_BASE_URL}/uploads/${encodeURIComponent(resource.filename)}`} download={resource.filename}>
                            {resource.filename}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
