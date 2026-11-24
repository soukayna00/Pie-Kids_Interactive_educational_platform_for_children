import { API_BASE_URL } from '../../../apiBase.js';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import axios from 'axios';
import 'react-quill/dist/quill.snow.css';
import './DetailCourses.css';

export default function DetailCourses() {
  const { id } = useParams();
  return <CourseDetail key={id} id={id} />;
}

function CourseDetail({ id }) {
  const url = `${API_BASE_URL}/cours/${encodeURIComponent(id)}`;
  const [course, setCourse] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const submitting = useRef(false);
  const editor = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    axios.get(url, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setCourse(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => controller.abort();
  }, [url, attempt]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get('titre')).trim();
    setStatus('');
    setError('');

    if (!title || editor.current.getEditor().getLength() <= 1) {
      setError('Enter a chapter title and content.');
      return;
    }

    data.set('titre', title);
    data.set('content', content);
    if (!data.get('resources')?.name) data.delete('resources');
    submitting.current = true;
    setPending(true);

    try {
      await axios.patch(`${url}/chapitres`, data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      form.reset();
      setContent('');
      setStatus('Chapter added.');
      try {
        const { data: updatedCourse } = await axios.get(url);
        setCourse(updatedCourse);
      } catch {
        setStatus('Chapter added. Refresh the page to see the updated chapter list.');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We couldn’t save the chapter. Please try again.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  const chapters = course?.chapitres?.filter(Boolean) ?? [];

  return (
    <main className="pie-course-detail">
      <div className="pie-course-detail__inner">
        <Link to="/cours">← Manage Courses</Link>
        {loadError ? (
          <div>
            <p role="alert">We couldn’t load this course.</p>
            <button type="button" onClick={() => {
              setLoadError(false);
              setAttempt((previous) => previous + 1);
            }}>Try Again</button>
          </div>
        ) : !course ? (
          <p role="status">Loading course…</p>
        ) : (
          <>
            <header className="pie-course-detail__intro">
              <h1>{course.titre}</h1>
              {course.description && <p>{course.description}</p>}
            </header>

            <section className="pie-course-detail__panel" aria-labelledby="chapter-list-title">
              <h2 id="chapter-list-title">Chapters</h2>
              {chapters.length ? (
                <ol>{chapters.map((chapter) => <li key={chapter._id}>{chapter.titre}</li>)}</ol>
              ) : (
                <p>No chapters yet. Add the first one below.</p>
              )}
            </section>

            <section className="pie-course-detail__panel" aria-labelledby="new-chapter-title">
              <h2 id="new-chapter-title">Add a Chapter</h2>
              <form onSubmit={handleSubmit}>
                <fieldset disabled={pending}>
                  <label>
                    Chapter title
                    <input name="titre" required />
                  </label>
                  <div>
                    <h3>Chapter content</h3>
                    <ReactQuill
                      ref={editor}
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      readOnly={pending}
                    />
                  </div>
                  <label>
                    Resource file (optional)
                    <input name="resources" type="file" />
                  </label>
                  <button type="submit">{pending ? 'Saving…' : 'Add Chapter'}</button>
                </fieldset>
                {error && <p className="pie-course-detail__error" role="alert">{error}</p>}
                {status && <p role="status">{status}</p>}
              </form>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
