import { API_BASE_URL } from '../../../apiBase.js';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../Sidebar/sidebar';
import './EditCourse.css';


export default function EditCourse() {
  const { courseId } = useParams();
  return <CourseEditor key={courseId} id={courseId} />;
}

function CourseEditor({ id }) {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);
  const safeId = encodeURIComponent(id);

  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal };

    Promise.all([
      axios.get(`${API_BASE_URL}/cours/${safeId}`, config),
      axios.get(`${API_BASE_URL}/trancheAge`, config),
      axios.get(`${API_BASE_URL}/competences/all`, config),
    ]).then(([course, ages, skills]) => {
      if (!controller.signal.aborted) {
        setData({ course: course.data, ages: ages.data, skills: skills.data });
      }
    }).catch(() => {
      if (!controller.signal.aborted) setLoadError(true);
    });

    return () => controller.abort();
  }, [safeId, attempt]);

  async function save(event) {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const body = new FormData(form);
    const title = String(body.get('titre')).trim();
    const description = String(body.get('description')).trim();
    setSaved(false);
    setError('');
    if (!title || !description) {
      setError('Enter a title and description.');
      return;
    }

    body.set('titre', title);
    body.set('description', description);
    body.set('Competences', JSON.stringify(body.getAll('Competences')));
    if (!body.get('Thumbnail')?.name) body.delete('Thumbnail');

    submitting.current = true;
    setPending(true);
    try {
      await axios.put(`${API_BASE_URL}/cours/editCourse/${safeId}`, body, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      form.elements.namedItem('Thumbnail').value = '';
      setSaved(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We couldn’t save the changes. Please try again.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  const selectedSkills = new Set(data?.course.Competences?.map((skill) => skill?._id ?? skill));
  const currentAge = data?.course.trancheAge;

  return (
    <main className="pie-add-course pie-edit-course">
      <div className="pie-add-course__layout">
        <Sidebar />
        <section className="pie-add-course__panel" aria-labelledby="edit-course-title">
          <Link to="/cours">← Manage Courses</Link>
          <h1 id="edit-course-title">Edit Course</h1>

          {loadError ? (
            <div>
              <p role="alert">We couldn’t load the course or its form options.</p>
              <button type="button" onClick={() => {
                setLoadError(false);
                setAttempt((previous) => previous + 1);
              }}>Try Again</button>
            </div>
          ) : !data ? (
            <p role="status">Loading course…</p>
          ) : (
            <form onSubmit={save} onChange={() => setSaved(false)}>
              <label>
                Course title
                <input name="titre" defaultValue={data.course.titre} required />
              </label>
              <label>
                Description
                <textarea name="description" defaultValue={data.course.description} rows={4} required />
              </label>
              <label>
                Replace cover image (optional)
                <input type="file" name="Thumbnail" accept="image/*" />
              </label>
              <label>
                Age range
                <select name="trancheAge" defaultValue={currentAge?._id ?? currentAge ?? ''}>
                  <option value="">No age range</option>
                  {data.ages.map(({ _id, ageMin, ageMax }) => (
                    <option key={_id} value={_id}>Ages {ageMin}–{ageMax}</option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend>Skills</legend>
                {data.skills.length === 0 && <p>No skills are available.</p>}
                <div className="pie-add-course__skills">
                  {data.skills.map(({ _id, Titre }) => (
                    <label key={_id}>
                      <input type="checkbox" name="Competences" value={_id} defaultChecked={selectedSkills.has(_id)} />
                      {Titre}
                    </label>
                  ))}
                </div>
              </fieldset>
              {error && <p className="pie-add-course__error" role="alert">{error}</p>}
              {saved && <p role="status">Changes saved. <Link to={`/cours/detailCourse/${safeId}`}>View Course</Link></p>}
              <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save Changes'}</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
